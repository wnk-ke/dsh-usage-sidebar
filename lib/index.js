// dsh-usage-sidebar — DeepSeek 余额与消费监控插件（host half）。
//
// 提供三个本地 HTTP 路由：
//   GET  /api/dsh-usage-sidebar/balance    → 官方 GET /user/balance 余额
//   GET  /api/dsh-usage-sidebar/stats      → 累计消费（官方 total_costs）+ 本月/今日消费与 tokens + 近 7 天明细
//   GET  /api/dsh-usage-sidebar/credential → 手动凭证配置状态（不含值）
//   POST /api/dsh-usage-sidebar/credential → 保存/清除手动 API Key 或平台 Token（credentials 持久化）
//
// 凭证解析优先级：手动（DSH_DEEPSEEK_SPEND_API_KEY / DSH_DEEPSEEK_SPEND_PLATFORM_TOKEN）
// → harness 本机（DEEPSEEK_API_KEY / DEEPSEEK_PLATFORM_TOKEN）。密钥只发往 DeepSeek 官方域。
//
// 累计消费来自 platform.deepseek.com 私有后台接口（需登录网站的 userToken，不是 API Key），
// 请求必须携带浏览器 User-Agent 等头，否则会被 WAF 拦截。
//
// 未配置平台 userToken 时回退到本机会话日志：只统计 token 数量，不做花费估算。

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import * as zlib from 'node:zlib'

export const name = 'dsh-usage-sidebar'
export const inject = ['credentials']

const API_BASE = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')
const PLATFORM_BASE = 'https://platform.deepseek.com/api/v0'
const TIMEOUT_MS = 20000

const BALANCE_PATH = '/user/balance'
const SUMMARY_PATH = '/users/get_user_summary'
const AMOUNT_PATH = '/usage/amount'
const COST_PATH = '/usage/cost'

const BALANCE_ROUTE = '/api/dsh-usage-sidebar/balance'
const STATS_ROUTE = '/api/dsh-usage-sidebar/stats'
const CREDENTIAL_ROUTE = '/api/dsh-usage-sidebar/credential'

const HARNESS_API_KEY_REF = 'DEEPSEEK_API_KEY'
const MANUAL_API_KEY_REF = 'DSH_DEEPSEEK_SPEND_API_KEY'
const ALLOWED_REFS = new Set([MANUAL_API_KEY_REF])

const KEY_RE = /^sk-[A-Za-z0-9_-]+$/

const PLATFORM_HEADERS = {
  'x-app-version': '1.0.0',
  Origin: 'https://platform.deepseek.com',
  Referer: 'https://platform.deepseek.com/usage',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

function sendJson(res, status, body) {
  res.writeHead(status, JSON_HEADERS)
  res.end(JSON.stringify(body))
}

// ---- 本地路由防护 ----
// 这些路由注册在 DSH 的本地 web 服务器上，默认不带鉴权，任何本机进程都能访问。
// 三层门槛：只许环回地址、拒绝跨源来源、要求客户端自定义头（跨源浏览器无法免预检发送）。
const MUTATION_MIN_INTERVAL_MS = 1000
const lastMutationAt = new Map()

function isLoopbackRequest(req) {
  const address = (req.socket && req.socket.remoteAddress) || ''
  return address === '::1' || address === '::ffff:127.0.0.1' || address.startsWith('127.')
}

function originAllowed(req) {
  const origin = req.headers.origin
  if (origin === undefined) return true
  if (origin === 'null') return false
  const host = req.headers.host
  if (typeof host !== 'string' || host === '') return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function guard(req, res, options = {}) {
  if (!isLoopbackRequest(req)) {
    sendJson(res, 403, { ok: false, error: 'loopback only' })
    return false
  }
  if (!originAllowed(req)) {
    sendJson(res, 403, { ok: false, error: 'cross-origin request refused' })
    return false
  }
  if (req.headers['x-dsh-spend'] !== '1') {
    sendJson(res, 403, { ok: false, error: 'missing client header' })
    return false
  }
  if (options.mutation === true) {
    const type = String(req.headers['content-type'] || '')
    if (!type.toLowerCase().startsWith('application/json')) {
      sendJson(res, 415, { ok: false, error: 'json body required' })
      return false
    }
    const key = String(req.url || '')
    const now = Date.now()
    if (now - (lastMutationAt.get(key) || 0) < MUTATION_MIN_INTERVAL_MS) {
      sendJson(res, 429, { ok: false, error: 'too many requests' })
      return false
    }
    lastMutationAt.set(key, now)
  }
  return true
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 64 * 1024) {
      const error = new Error('request body too large')
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

// 兼容 webServer / httpServer 两种载体的路由注册；服务出现前先挂监听。
function registerRoute(ctx, kind, path, handler, label) {
  let done = false
  const doRegister = (server) => {
    if (done || !server || typeof server.register !== 'function') return
    done = true
    ctx.effect(() => server.register({ kind, path, handler }), label)
  }
  const existing = ctx.get('webServer') ?? ctx.get('httpServer')
  if (existing) {
    doRegister(existing)
    return
  }
  const listener = (serviceName) => {
    if (serviceName === 'webServer' || serviceName === 'httpServer') {
      doRegister(ctx.get(serviceName))
    }
  }
  ctx.on('internal/service', listener)
  ctx.effect(() => () => ctx.off('internal/service', listener), `${label}: service listener`)
}

async function fetchJson(url, headers) {
  let response
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch (e) {
    throw new Error('网络请求失败: ' + ((e && e.message) || String(e)))
  }
  const text = await response.text()
  let body = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }
  if (!response.ok) {
    const msg =
      body && typeof body === 'object' && body.error && typeof body.error === 'object' && typeof body.error.message === 'string'
        ? body.error.message
        : `HTTP ${response.status}`
    throw new Error(msg)
  }
  if (body === null) throw new Error('响应解析失败: ' + text.slice(0, 200))
  return body
}

async function resolveApiKey(credentials) {
  const manual = await credentials.resolve(MANUAL_API_KEY_REF)
  if (manual && typeof manual.value === 'string' && manual.value !== '') {
    return { key: manual.value, source: 'manual' }
  }
  const hit = await credentials.resolve(HARNESS_API_KEY_REF)
  if (hit && typeof hit.value === 'string' && hit.value !== '') {
    return { key: hit.value, source: 'harness' }
  }
  return null
}

// 平台按月/日按北京时间（Asia/Shanghai，无夏令时）统计。
// 用运行机器的本地时区（Windows 时区设置）计算自然日，不写死 +08:00。
function localNow() {
  const d = new Date()
  const p = (n) => (n < 10 ? '0' + n : String(n))
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    dateKey: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()),
  }
}

// 通用信封：{ code, data: { biz_code, biz_data } }；40002/40003 表示登录态失效。
function parseEnvelope(body) {
  if (body === null || typeof body !== 'object') return { authError: false, ok: false }
  const code = body.code
  if (code !== undefined && code !== 0) return { authError: code === 40002 || code === 40003, ok: false }
  const data = body.data
  if (data === null || typeof data !== 'object') return { authError: false, ok: false }
  const bcode = data.biz_code
  if (bcode !== undefined && bcode !== 0) return { authError: bcode === 40002 || bcode === 40003, ok: false }
  return { authError: false, ok: true, biz: data.biz_data }
}

// summary：total_costs 是官方口径的累计消费。
function parseSummary(body) {
  const env = parseEnvelope(body)
  if (env.authError) return { authError: true, totalCost: 0, currency: null }
  if (!env.ok || env.biz === null || typeof env.biz !== 'object') {
    return { authError: false, totalCost: 0, currency: null }
  }
  const costs = Array.isArray(env.biz.total_costs) ? env.biz.total_costs : []
  let totalCost = 0
  let currency = null
  for (const c of costs) {
    if (c === null || typeof c !== 'object') continue
    const amount = Number(c.amount)
    if (Number.isFinite(amount)) totalCost += amount
    if (currency === null && typeof c.currency === 'string' && c.currency !== '') currency = c.currency
  }
  return { authError: false, totalCost, currency }
}

// amount/cost：biz_data 可能是单对象（amount）或按币种数组（cost），取第一个。
function parseUsage(body) {
  const env = parseEnvelope(body)
  if (env.authError) return { authError: true, item: null }
  const raw = env.biz
  if (raw === null || typeof raw !== 'object') return { authError: false, item: null }
  const entries = Array.isArray(raw) ? raw : [raw]
  for (const it of entries) {
    if (it !== null && typeof it === 'object') {
      return {
        authError: false,
        item: {
          days: Array.isArray(it.days) ? it.days : [],
          total: Array.isArray(it.total) ? it.total : [],
        },
      }
    }
  }
  return { authError: false, item: null }
}

// 把一天内各模型的 usage 累加进 dayMap。
function foldDay(dayMap, item, isCost) {
  if (item === null) return
  const days = item.days
  for (const day of days) {
    if (day === null || typeof day !== 'object' || typeof day.date !== 'string') continue
    let entry = dayMap.get(day.date)
    if (entry === undefined) {
      entry = { date: day.date, calls: 0, cost: 0, totalTokens: 0 }
      dayMap.set(day.date, entry)
    }
    const models = Array.isArray(day.data) ? day.data : []
    for (const model of models) {
      if (model === null || typeof model !== 'object') continue
      const usage = Array.isArray(model.usage) ? model.usage : []
      for (const it of usage) {
        if (it === null || typeof it !== 'object') continue
        const type = typeof it.type === 'string' ? it.type.toUpperCase() : ''
        const value = Number(it.amount)
        if (!Number.isFinite(value)) continue
        if (isCost) {
          if (type !== 'REQUEST') entry.cost += value
        } else if (type === 'REQUEST') {
          entry.calls += value
        } else if (
          type === 'PROMPT_CACHE_HIT_TOKEN' ||
          type === 'PROMPT_CACHE_MISS_TOKEN' ||
          type === 'PROMPT_TOKEN' ||
          type === 'RESPONSE_TOKEN'
        ) {
          entry.totalTokens += value
        }
      }
    }
  }
}

const r2 = (v) => Math.round(v * 100) / 100
const ri = (v) => Math.round(v)

// 最近 n 天的北京时间日期键（含今天），升序。
function lastDateKeys(now, n) {
  const parts = now.dateKey.split('-').map(Number)
  const keys = []
  for (let i = n - 1; i >= 0; i--) {
    // 用本地日期构造 + 本地格式化，跨夏令时也正确。
    const d = new Date(parts[0], parts[1] - 1, parts[2] - i)
    keys.push(localDateKey(d.getTime()))
  }
  return keys
}

// 北京时间日期键（毫秒时间戳）。
function localDateKey(ms) {
  const d = new Date(ms)
  const p = (n) => (n < 10 ? '0' + n : String(n))
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

// ---- 本地日志回退：未配置平台 userToken 时，只统计本机会话日志的 token ----
// 会话日志是多帧 zstd 追加流：单次 zstdDecompressSync 只解出第一帧（会话头），
// 流式解压又会在第二帧报 prefix_unknown。这里按 zstd 帧格式切帧，逐帧解压。
const localFileCache = new Map()
const LOCAL_CACHE_TTL_MS = 60000
let localUsageCache = { at: 0, value: null }

const ZSTD_MAGIC = [0x28, 0xb5, 0x2f, 0xfd]

// 返回从 start 开始的一帧的结束偏移；结构非法时返回 -1。
function zstdFrameEnd(buf, start) {
  if (buf.length - start < 6) return -1
  for (let i = 0; i < 4; i++) if (buf[start + i] !== ZSTD_MAGIC[i]) return -1
  const descriptor = buf[start + 4]
  let p = start + 5
  const fcsFlag = descriptor >> 6
  const singleSegment = (descriptor >> 5) & 1
  const checksum = (descriptor >> 2) & 1
  const dictFlag = descriptor & 3
  if (!singleSegment) p += 1
  if (dictFlag === 1) p += 1
  else if (dictFlag === 2) p += 2
  else if (dictFlag === 3) p += 4
  if (fcsFlag === 0) p += singleSegment ? 1 : 0
  else if (fcsFlag === 1) p += 2
  else if (fcsFlag === 2) p += 4
  else p += 8
  while (p + 3 <= buf.length) {
    const header = buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16)
    const last = header & 1
    const type = (header >> 1) & 3
    const size = header >> 3
    p += 3
    if (type === 0 || type === 2) p += size
    else if (type === 1) p += 1
    else return -1
    if (last) return checksum ? p + 4 : p
  }
  return -1
}

function decompressLogBuffer(buf) {
  if (typeof zlib.zstdDecompressSync !== 'function') throw new Error('zstd unsupported')
  const parts = []
  let p = 0
  while (p < buf.length) {
    const end = zstdFrameEnd(buf, p)
    if (end <= p) break
    parts.push(zlib.zstdDecompressSync(buf.subarray(p, end)))
    p = end
  }
  if (parts.length === 0) return ''
  return Buffer.concat(parts).toString('utf8')
}

function sessionsRoot() {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(home, 'sessions')
}

// 列出 <root>/<workspace>/<session>/*.jsonl.zstd；同一会话同时存在迁移前后两份时只取 v4。
function listSessionLogs() {
  const root = sessionsRoot()
  const files = []
  let workspaces = []
  try {
    workspaces = readdirSync(root, { withFileTypes: true })
  } catch {
    return files
  }
  for (const workspace of workspaces) {
    if (!workspace.isDirectory()) continue
    const workspaceDir = join(root, workspace.name)
    let sessions = []
    try {
      sessions = readdirSync(workspaceDir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const session of sessions) {
      if (!session.isDirectory()) continue
      const sessionDir = join(workspaceDir, session.name)
      let entries = []
      try {
        entries = readdirSync(sessionDir, { withFileTypes: true })
      } catch {
        continue
      }
      const candidates = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl.zstd'))
        .map((entry) => entry.name)
      if (candidates.length === 0) continue
      const v4 = candidates.filter((name) => name.includes('.v4.'))
      const chosen = v4.length > 0 ? v4 : candidates
      for (const name of chosen) files.push(join(sessionDir, name))
    }
  }
  return files
}

const toNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

// 单份日志里的每条 assistant/message 视为一次模型调用；token = 未缓存输入 + 缓存读 + 缓存写 + 输出。
function readUsageEntries(file, stat) {
  const cached = localFileCache.get(file)
  if (cached !== undefined && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) return cached.entries
  let text = ''
  try {
    text = decompressLogBuffer(readFileSync(file))
  } catch {
    return cached === undefined ? [] : cached.entries
  }
  const entries = []
  for (const line of text.split('\n')) {
    if (line === '') continue
    let event
    try {
      event = JSON.parse(line)
    } catch {
      continue
    }
    if (event === null || typeof event !== 'object' || event.type !== 'assistant/message') continue
    const usage = event.data && event.data.usage
    if (usage === null || typeof usage !== 'object') continue
    const tokens =
      toNumber(usage.inputTokens) +
      toNumber(usage.cacheReadTokens) +
      toNumber(usage.cacheWriteTokens) +
      toNumber(usage.outputTokens)
    if (!(tokens > 0)) continue
    const time = typeof event.time === 'number' ? event.time : null
    if (time === null) continue
    entries.push({ time, tokens })
  }
  localFileCache.set(file, { mtimeMs: stat.mtimeMs, size: stat.size, entries })
  return entries
}

async function collectLocalUsage() {
  const now = Date.now()
  if (localUsageCache.value !== null && now - localUsageCache.at < LOCAL_CACHE_TTL_MS) return localUsageCache.value

  const recentKeys = lastDateKeys(localNow(), 7)
  const since = now - 31 * 86400000
  const byDay = new Map()
  let sessions = 0
  for (const file of listSessionLogs()) {
    await new Promise((resolve) => setImmediate(resolve))
    let stat
    try {
      stat = statSync(file)
    } catch {
      continue
    }
    if (stat.size > 64 * 1024 * 1024) continue
    sessions += 1
    for (const entry of readUsageEntries(file, stat)) {
      if (entry.time < since) continue
      const key = localDateKey(entry.time)
      const day = byDay.get(key) || { date: key, totalTokens: 0, calls: 0 }
      day.totalTokens += entry.tokens
      day.calls += 1
      byDay.set(key, day)
    }
  }

  const monthPrefix = localNow().dateKey.slice(0, 7)
  const monthStat = { cost: null, calls: 0, totalTokens: 0 }
  for (const [key, day] of byDay) {
    if (key.slice(0, 7) !== monthPrefix) continue
    monthStat.calls += day.calls
    monthStat.totalTokens += day.totalTokens
  }
  const todayKey = localNow().dateKey
  const today = byDay.get(todayKey) || { totalTokens: 0, calls: 0 }
  const days = recentKeys.map((date) => {
    const day = byDay.get(date)
    return { date, cost: null, calls: day ? ri(day.calls) : 0, totalTokens: day ? ri(day.totalTokens) : 0 }
  })

  const value = {
    ok: true,
    local: true,
    source: 'local',
    currency: null,
    scanned: { sessions },
    today: { cost: null, calls: ri(today.calls), totalTokens: ri(today.totalTokens) },
    month: { cost: null, calls: ri(monthStat.calls), totalTokens: ri(monthStat.totalTokens) },
    days,
    updatedAt: now,
  }
  localUsageCache = { at: now, value }
  return value
}

// 官方统计：请求头由调用方给出（userToken 的 Authorization，或 DSH 账户会话的 x-dsh-auth-token）。
// 平台按 UTC 自然日聚合，网页按本地时区自然日显示；用本地日志的时段分布把 UTC 日拆到本地日。
function utcDaySplits(utcDate) {
  const start = Date.parse(utcDate + 'T00:00:00Z')
  const counts = new Map()
  for (let hour = 0; hour < 24; hour++) {
    const key = localDateKey(start + hour * 3600000)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return [...counts.entries()].map(([key, count]) => [key, count / 24])
}

function localDayWeights() {
  const weights = new Map()
  const since = Date.now() - 40 * 86400000
  for (const file of listSessionLogs()) {
    let stat
    try {
      stat = statSync(file)
    } catch {
      continue
    }
    if (stat.size > 64 * 1024 * 1024) continue
    for (const entry of readUsageEntries(file, stat)) {
      if (entry.time < since) continue
      const utc = new Date(entry.time).toISOString().slice(0, 10)
      const bj = localDateKey(entry.time)
      let row = weights.get(utc)
      if (row === undefined) {
        row = new Map()
        weights.set(utc, row)
      }
      row.set(bj, (row.get(bj) || 0) + entry.tokens)
    }
  }
  return weights
}

async function fetchOfficialStats(headers, source) {
  const now = localNow()
  const recentKeys = lastDateKeys(now, 7)
  // 本地日 B 由 UTC 日 B-1 与 B 组成，所以最早那一天要连带取前一个月。
  const firstKey = recentKeys[0]
  const priorKey = new Date(Date.parse(firstKey + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10)
  const months = [...new Set([...recentKeys.map((k) => k.slice(0, 7)), priorKey.slice(0, 7)])]
  const monthRequests = months.map((key) => {
    const [year, month] = key.split('-')
    const query = '?month=' + Number(month) + '&year=' + Number(year)
    return Promise.all([
      fetchJson(PLATFORM_BASE + COST_PATH + query, headers),
      fetchJson(PLATFORM_BASE + AMOUNT_PATH + query, headers),
    ])
  })
  const [summaryBody, ...monthBodies] = await Promise.all([
    fetchJson(PLATFORM_BASE + SUMMARY_PATH, headers),
    ...monthRequests,
  ])
  const sp = parseSummary(summaryBody)
  if (sp.authError) {
    return {
      error: 'auth',
      message: '平台授权无效或已过期：请在 platform.deepseek.com 重新登录（或重新登录 DSH 账户）。',
    }
  }

  // 先按平台 UTC 日汇总，再用本地时段分布拆到北京日。
  const utcDays = new Map()
  for (const [costBody, amountBody] of monthBodies) {
    const cp = parseUsage(costBody)
    const ap = parseUsage(amountBody)
    if (cp.authError || ap.authError) {
      return {
        error: 'auth',
        message: '平台授权无效或已过期：请在 platform.deepseek.com 重新登录（或重新登录 DSH 账户）。',
      }
    }
    const dayMap = new Map()
    foldDay(dayMap, cp.item, true)
    foldDay(dayMap, ap.item, false)
    for (const [date, day] of dayMap) {
      const target = utcDays.get(date) || { cost: 0, calls: 0, tokens: 0 }
      target.cost += day.cost
      target.calls += day.calls
      target.tokens += day.totalTokens
      utcDays.set(date, target)
    }
  }

  const weights = localDayWeights()
  const bjDays = new Map()
  const addTo = (key, patch) => {
    const current = bjDays.get(key) || { cost: 0, calls: 0, tokens: 0 }
    current.cost += patch.cost || 0
    current.calls += patch.calls || 0
    current.tokens += patch.tokens || 0
    bjDays.set(key, current)
  }
  for (const [utcDate, day] of utcDays) {
    const row = weights.get(utcDate)
    let splits
    if (row !== undefined && row.size > 0) {
      let total = 0
      for (const value of row.values()) total += value
      splits = total > 0 ? [...row.entries()].map(([bj, value]) => [bj, value / total]) : []
    }
    if (splits === undefined || splits.length === 0) {
      // 没有本地分布时，按该 UTC 日的每个小时落在哪个本地日拆分。
      splits = utcDaySplits(utcDate)
    }
    for (const [bj, fraction] of splits) {
      addTo(bj, { cost: day.cost * fraction, calls: day.calls * fraction, tokens: day.tokens * fraction })
    }
  }

  const monthPrefix = now.dateKey.slice(0, 7)
  const monthStat = { cost: 0, calls: 0, tokens: 0 }
  for (const [date, day] of bjDays) {
    if (date.slice(0, 7) !== monthPrefix) continue
    monthStat.cost += day.cost
    monthStat.calls += day.calls
    monthStat.tokens += day.tokens
  }
  const today = bjDays.get(now.dateKey) || { cost: 0, calls: 0, tokens: 0 }
  const days = recentKeys.map((date) => {
    const day = bjDays.get(date)
    return {
      date,
      cost: r2(day ? day.cost : 0),
      calls: ri(day ? day.calls : 0),
      totalTokens: ri(day ? day.tokens : 0),
    }
  })

  return {
    ok: true,
    source,
    dayBasis: 'local',
    currency: sp.currency || 'CNY',
    cumulative: { cost: r2(sp.totalCost) },
    month: { cost: r2(monthStat.cost), calls: ri(monthStat.calls), totalTokens: ri(monthStat.tokens) },
    today: { cost: r2(today.cost), calls: ri(today.calls), totalTokens: ri(today.tokens) },
    days,
    updatedAt: Date.now(),
  }
}

// 账户模式：DSH 已登录时复用平台会话（无需 userToken）。失败时静默返回 null。
async function collectAccountStats(ctx) {
  const account = ctx.get('deepseekAccount')
  if (account === undefined || typeof account.getPlatformSession !== 'function') return { status: 'absent' }
  let session
  try {
    session = await account.getPlatformSession()
  } catch {
    return { status: 'absent' }
  }
  if (session === null || typeof session !== 'object') return { status: 'absent' }
  if (typeof session.token !== 'string' || session.token === '') return { status: 'absent' }
  const headers = {
    ...PLATFORM_HEADERS,
    ...(session.requestHeaders !== null && typeof session.requestHeaders === 'object' ? session.requestHeaders : {}),
    'x-dsh-auth-token': session.token,
  }
  try {
    const stats = await fetchOfficialStats(headers, 'account')
    if (stats.ok) return { status: 'ok', stats }
    return { status: stats.error === 'auth' ? 'rejected' : 'error' }
  } catch {
    return { status: 'error' }
  }
}

async function collectStats(ctx) {
  const account = await collectAccountStats(ctx)
  if (account.status === 'ok') return account.stats
  return { local: true, accountStatus: account.status }
}

export async function apply(ctx) {
  const credentials = ctx.credentials

  registerRoute(ctx, 'exact', BALANCE_ROUTE, async (req, res) => {
    if (!guard(req, res)) return
    try {
      const k = await resolveApiKey(credentials)
      if (k === null) {
        sendJson(res, 503, {
          ok: false,
          code: 'no-api-key',
          error: '未配置 DeepSeek API Key：可在设置 → DeepSeek 余额 中填写，或在 DSH 设置 → 模型中配置 DEEPSEEK_API_KEY。',
        })
        return
      }
      if (!KEY_RE.test(k.key)) {
        sendJson(res, 400, { ok: false, code: 'error', error: 'API Key 格式不正确：应为 sk- 开头的字符' })
        return
      }
      const body = await fetchJson(`${API_BASE}${BALANCE_PATH}`, {
        Authorization: `Bearer ${k.key}`,
        Accept: 'application/json',
      })
      if (body && typeof body === 'object' && Array.isArray(body.balance_infos)) {
        sendJson(res, 200, {
          ok: true,
          source: k.source,
          is_available: !!body.is_available,
          balance_infos: body.balance_infos.map((b) => ({
            currency: b.currency,
            total_balance: b.total_balance,
            granted_balance: b.granted_balance,
            topped_up_balance: b.topped_up_balance,
          })),
        })
        return
      }
      sendJson(res, 502, { ok: false, code: 'error', error: '响应缺少 balance_infos 字段' })
    } catch (e) {
      const msg = (e && e.message) || String(e)
      sendJson(res, /authentication fails/i.test(msg) ? 401 : 502, {
        ok: false,
        code: 'error',
        error: /authentication fails/i.test(msg) ? 'API Key 无效（认证失败）' : msg,
      })
    }
  }, 'dsh-usage-sidebar: balance route')

  registerRoute(ctx, 'exact', STATS_ROUTE, async (req, res) => {
    if (!guard(req, res)) return
    try {
      const stats = await collectStats(ctx)
      if (stats.local === true) {
        // 未登录：只给本机日志的 token，不给花费。
        const local = await collectLocalUsage()
        sendJson(res, 200, { ...local, accountStatus: stats.accountStatus })
        return
      }
      sendJson(res, 200, stats)
    } catch (e) {
      sendJson(res, 502, { ok: false, code: 'error', error: '统计获取失败: ' + ((e && e.message) || String(e)) })
    }
  }, 'dsh-usage-sidebar: stats route')

  registerRoute(ctx, 'exact', CREDENTIAL_ROUTE, async (req, res) => {
    if (!guard(req, res, { mutation: req.method === 'POST' })) return
    try {
      if (req.method === 'POST') {
        const body = await readJsonBody(req)
        const ref = body && typeof body.ref === 'string' ? body.ref : null
        if (ref === null || !ALLOWED_REFS.has(ref)) {
          sendJson(res, 400, { ok: false, error: '非法 credential ref' })
          return
        }
        const value = typeof body.value === 'string' ? body.value.trim() : ''
        if (value === '') {
          await credentials.unset(ref)
        } else {
          await credentials.set(ref, value)
        }
        sendJson(res, 200, { ok: true })
        return
      }
      if (req.method === 'GET') {
        const manualKey = await credentials.resolve(MANUAL_API_KEY_REF)
        sendJson(res, 200, {
          ok: true,
          apiKeyConfigured: !!(manualKey && typeof manualKey.value === 'string' && manualKey.value !== ''),
        })
        return
      }
      sendJson(res, 405, { ok: false, error: 'method not allowed' })
    } catch (e) {
      sendJson(res, 400, { ok: false, error: (e && e.message) || String(e) })
    }
  }, 'dsh-usage-sidebar: credential route')

  // 预热本地日志缓存，避免首次打开弹层时阻塞 host 事件循环。
  setTimeout(() => {
    collectLocalUsage().catch(() => {})
  }, 2000)
}

export { collectLocalUsage, fetchOfficialStats };
