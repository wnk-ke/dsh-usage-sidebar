// 发布辅助：把 package.json 的版本与当前 commit 同步进 market-index.json 并校验。
// 用法：node scripts/release.mjs [--check]
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const dir = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const pkgPath = dir + 'package.json'
const indexPath = dir + 'market-index.json'
const checkOnly = process.argv.includes('--check')

function headCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim()
  } catch (e) {
    // 沙箱/受限环境无法 spawn 时，直接读 .git 引用。
    const head = fs.readFileSync(dir + '.git/HEAD', 'utf8').trim()
    if (head.startsWith('ref: ')) return fs.readFileSync(dir + '.git/' + head.slice(5), 'utf8').trim()
    return head
  }
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
const plugin = index.plugins[0]
const entry = plugin.versions[0]

if (!checkOnly) {
  const commit = headCommit()
  entry.version = pkg.version
  entry.publishTimestamp = Math.floor(Date.now() / 1000)
  entry.source = { type: 'git', url: 'https://github.com/wnk-ke/dsh-usage-sidebar', commit }
  plugin.versions = [entry]
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf8')
  console.log('synced index -> version', pkg.version, 'commit', commit)
}

const problems = []
const LANG = /^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/
for (const field of ['title', 'description']) {
  if (!plugin[field] || !plugin[field].en) problems.push(field + ' needs en')
  for (const key of Object.keys(plugin[field] || {})) if (!LANG.test(key)) problems.push(field + ' key ' + key)
}
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(entry.version)) problems.push('version not semver')
if (entry.version !== pkg.version) problems.push('version mismatch with package.json')
if (!/^[0-9a-f]{40}$/.test(entry.source.commit)) problems.push('commit not 40-hex')
if (entry.source.type !== 'git') problems.push('source type')
if (!entry.engines || !entry.engines.dsh) problems.push('engines.dsh missing')

console.log(problems.length === 0 ? 'index OK' : 'index problems: ' + problems.join(', '))
if (problems.length > 0) process.exit(1)
