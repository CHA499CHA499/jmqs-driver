# Persona Driver（假面骑事）

Persona Driver 是一个 vinext/React 互动工作台：用户从新手包获得五张基线 Persona 卡，把一张卡和两根已注入内容的变身棒装入二维 Driver；localhost 完整运行时再通过 Local Bridge 创建 YouNavi 对话、审计 Skill 与原文 EOF，最后在安全 Markdown 阅读器中展示结果。

当前源码是唯一真源。旧 Sites 版本只作历史留档，不代表当前交互。

## 当前状态

- 已接线：新手包、五卡发牌、卡架/详情、双棒、管理中心、Persona Run v1/v2、continuation、等待视频、结果阅读器、Soul 向导与本地 supervisor。
- 自动化：2026-08-24 `npm test` 为 100 通过、2 个真实端口测试因 Codex 沙箱限制跳过、0 失败；TypeScript `--noEmit`、构建与 diff check 通过，lint 0 error（18 个 `<img>` 性能 warning）。
- 尚未完成验收：真实浏览器 5/7/12 卡与窄屏拖拽、真实 YouNavi Persona/Soul 全链路、动态 Soul Skill 索引。

不要把“构建/夹具测试通过”写成“真实运行态已验收”。详细模块与测试覆盖见 [INDEX.md](INDEX.md)。

## 快速运行

要求 Node `>=22.13.0`，并在已登录的 YouNavi 环境中运行。

### YouNavi Agent 一键安装

在 YouNavi 中对 Agent 说“安装并启动 Persona Driver”，Agent 会加载项目内 `$persona-driver-setup`：校验四份内置原文，幂等安装五个人物 Skill 与随仓 `create-soul`，生成 `.env.local`，执行 `npm ci` / 测试，启动 Web + Bridge 并打开页面。该 Skill 默认用户已登录，不处理认证。

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。`npm run dev` 启动 supervisor，同时确保：

- vinext web：`localhost:3000`
- Local Bridge：`127.0.0.1:8766`

也可以拆开运行：

```bash
npm run dev:web
npm run navi:bridge
```

只启动 web 时可以体验 UI，但真实 Run 会显示 `BRIDGE_OFFLINE`。公开 hostname 会进入 `demo`，不会调用本机 Bridge。

## 本机前置条件

Persona Run 默认从以下位置读取依赖：

- agent-cli：YouNavi / YouNavi Internal / YouNavi Debug App 包内自动探测，也可设 `PERSONA_NAVI_AGENT_CLI`。
- Skill 根：通过 `.env.local` 的 `PERSONA_NAVI_SKILLS_DIR` 配置；未配置时使用项目私有 `.local/skills`。
- 固定原文：随仓位于 `materials/classic-interviews/`，由 manifest 固定字节数与 SHA-256；`PERSONA_NAVI_MATERIAL_ROOT` 仅用于显式覆盖。
- Run 审计：项目 `.persona-runs/`，可设 `PERSONA_NAVI_RUN_ROOT`。
- Soul 输出工作区：通过 `PERSONA_NAVI_SOUL_WORKSPACE_ROOT` 配置；未配置时使用 `.local/soul-workspace`。

五个固定 Skill 名为：

| Persona | Skill |
|---|---|
| Naval Ravikant | `naval-perspective` |
| Elon Musk | `elon-musk-perspective` |
| Steve Jobs | `steve-jobs-perspective` |
| Donald John Trump | `trump-perspective` |
| Paul Graham | `paul-graham-perspective` |

Soul 链还要求安装 `create-soul`。本地文件存在不等于动态索引已确认；当前 Soul 卡即使通过产物校验，也保持 `unmapped`。

## 体验主链

```text
准备变身
  → 新手卡包
  → 五卡发牌/逐张 motion（可跳过）
  → 收下卡牌进入空工作台
  → 选择/拖入人物卡
  → 能量棒注入一篇固定原文或单个 .md/.txt
  → 技能棒注入评审/解释/决策/行动或 custom Prompt
  → 两棒分别拖入正确槽位
  → 显式启动
  → Local Bridge / YouNavi
  → pending/running 等待窗
  → Skill + EOF 审计
  → 完整 Markdown 结果阅读器
```

关键规则：

- 每个 Run 只允许一篇固定素材或一个自定义文档。
- 自定义文档只接受 UTF-8 `.md/.txt`，实际字节 ≤ 1 MiB。
- custom Prompt ≤ 4,000 字符。
- `normal` 已废弃；固定 Prompt 只有 `review/explain/decision/action`。
- `charged` 只表示棒内已有内容；只有命中正确槽位才成为 `equipped`。
- YouNavi task 结束后仍要验证期望 Skill 与原文 EOF；否则结果不会打开。

## Persona 与 Soul 两条链路

Persona 链读取一篇已冻结原文，用固定或 custom Prompt 执行一次角色视角任务。固定素材走 `persona.navi-run/v1`；自定义文档走 v2。素材未读到 EOF 时返回 `incomplete`，用户可在同一 conversation 中 continuation。

Soul 链通过 `/create-soul` 生成完整 Soul Skill。向导必须确认采集范围、隐私排除和多人素材纯化；Bridge 禁止目录/glob、vault、主目录和未列出路径。产物必须包含完整 persona、quotes、sources 与 knowledge 文件后才可投影为卡片。

链路图、状态机和数据流见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)，HTTP/schema 见 [INTERFACE.md](INTERFACE.md)。

## 运行数据

`.persona-runs/` 是 gitignored 的本机审计目录，可能包含文档正文、绝对路径、Prompt、task/conversation ID 和结果。不要发布或随意删除；request 已写但 receipt 缺失时，Bridge 会拒绝自动重发，避免重复 conversation。

浏览器 localStorage 分别保存：卡包进度、最多 50 条启动摘要、自建/Soul 卡、随机立绘游标、自定义 Prompt 与自定义素材。“重新开始”只清卡包/当前体验，不清启动历史、YouNavi conversation 或 `.persona-runs/`。

## 静态资产边界

当前 Driver 运行时只读取 `public/driver-textures/` 中的二维 PNG/CSS 层；历史 GLB 已移到项目外归档，不进入浏览器运行链或发布包。

开包 motion 使用混合真源：Naval/Musk 在 `public/personas-motion/`，Jobs/Trump/Paul Graham 在 `public/personas-motion-v3-intense/`。Driver 激活 motion 当前由 `DRIVER_ACTIVATION_MOTION_ENABLED=false` 关闭。

用户确认 Decade local-test 声音与中间 6 分钟的 480p 等待视频是完整项目必需资产，因此随仓保留。它们包含第三方来源的本地测试材料；技术上会进入静态构建，但公开分发前仍需单独确认授权边界。完整 480p/720p 备份和其它历史素材不在源码仓。

## 验证

```bash
npm test
npm run lint
```

`npm test` 会先构建，再运行 `tests/*.test.mjs`。它覆盖请求校验、状态合同、素材/Skill 夹具、EOF/continuation、Soul 产物夹具、媒体门控和渲染引用；不覆盖真实账号、真实浏览器交互与动态 Skill 索引。

真实收口至少还应手工验证：

1. 1440px 与 390px 页面、5/7/12 卡架、鼠标拖拽和键盘回退。
2. 本机 `/health` 的 CLI、五 Skill、四固定素材与 create-soul 状态。
3. v1 固定素材和 v2 自定义文档各一次真实 Run。
4. 一次未到 EOF → continuation → completed。
5. 等待窗关闭不取消任务，结果窗仅完整结果自动打开。
6. Soul 失败不写卡，完整产物写卡但动态索引未确认时保持 unmapped。

## 文档导航

- [INDEX.md](INDEX.md)：目录树、模块表、运行命令、测试矩阵、数据目录、资产、故障码、扩展与废弃策略
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)：Browser → Local Bridge → agent-cli → YouNavi 的 Persona/Soul 双链路
- [INTERFACE.md](INTERFACE.md)：对外合同与安全边界
- [ROLLBACK.md](ROLLBACK.md)：证据保全与分层回退
- [CHANGELOG.md](CHANGELOG.md)：变更记录
