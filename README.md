# dsh-usage-sidebar

DeepSeek 余额与用量，常驻在 DeepSeek Harness（DSH）桌面端的**左侧导航栏底部**。

## 功能

- 侧边栏底部芯片：当前余额 + 今日 token（登录后额外显示今日花费），每 60 秒刷新
- 点击芯片：近 7 天逐日 token 与花费（登录后）、本月合计、累计消费
- 设置 → **DeepSeek 余额与用量**：余额明细（总额 / 赠送 / 充值）、用量统计、近 7 天、API Key 配置
- 中英双语：跟随 DSH 界面语言，未设置时跟随系统语言

## 显示逻辑

| 状态 | 余额 | token | 花费 |
| --- | --- | --- | --- |
| 已登录 DeepSeek 账号 | API Key 余额（若配置） | 平台官方 | 平台官方 |
| 未登录 | API Key 余额 | 本机会话日志 | 不显示，提示「登录后可查看详细用量与费用」 |

数据口径：

- **余额**：官方 `GET https://api.deepseek.com/user/balance`，使用 DSH 的 `DEEPSEEK_API_KEY` 或手动配置的 Key。
- **已登录用量**：通过 DSH 账户会话（`deepseekAccount.getPlatformSession()`）调用 platform 的 summary / usage 接口，无需 userToken。
- **未登录 token**：读取 `$DSH_HOME/sessions` 下的会话日志（多帧 zstd），按本机时区的自然日汇总 `assistant/message` 的 usage。
- **日界**：平台接口按 UTC 日聚合，网页按本地时区显示；插件用本地日志的时段分布把每个 UTC 日拆到本地日，总量不变。

## 安装

### 从 npm（推荐）

```powershell
dsh plugin --profile <profile> add dsh-usage-sidebar
```

桌面端请在 **设置 → 插件 → 添加插件** 中填入包名。

### 本地目录

```json
{
  "dependencies": { "dsh-usage-sidebar": "file:/absolute/path" },
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "dsh-usage-sidebar"] } }
}
```

把本目录放进 profile 的 `node_modules`，重启应用。

## 隐私与安全

- API Key 与账户会话只在 Host 进程内使用；浏览器端只收到余额与统计数字，任何路由都不返回密钥。
- 本地路由只接受环回地址、校验同源、要求 `x-dsh-spend: 1` 请求头，写入类请求限流。
- 不写入任何凭据到插件目录；手动 Key 通过 DSH credentials 保存。
- 请求只发往 `api.deepseek.com` 与 `platform.deepseek.com`。

## 兼容性

- DSH `>=0.2.1-rc.5 <0.4.0`
- 客户端插件协议：`window.__ModuleLoader__.load` + `dsh.client` 声明
- 账户模式依赖 `deepseekAccount` 服务；服务缺失或未登录时自动回退到本地日志

## 开发

```powershell
node --check lib/index.js
node --check lib/client.js
```

改完后按 profile 的安装方式同步，重启桌面端（Host 半改动必须重启）。

## 显示与交互

- 侧边栏底部一行：`余额：￥30.63  今天：￥0.00  8.10M token`（不换行，超长省略）
- 余额颜色：≥￥5 绿色，<￥5 红色；「今天」与 token 用次要文字色
- 点开弹层：近 7 天（当天一行蓝色、用量最高一行加粗）、本月与累计
- 弹层第二行：自动刷新勾选框（默认勾选）+ 间隔输入框（分钟，默认 5，可随时改，保存在本机 localStorage）；关闭勾选后只手动刷新
- 未登录时只显示余额与本机 token，并提示「登录后可查看详细用量与费用」

## 语言

- 简体中文、繁體中文、English、日本語、Français、Русский、Deutsch、Español，默认跟随系统/DSH 语言
- 弹层底部可随时切换；选择保存在本机，选「自动」恢复跟随系统

## 图标

- 通过 DSH 的 `locale` 服务注册中英字典，设置里切换界面语言即时生效
- 图标：`assets/icon.svg`（市场条目可用其 base64 data URL）
