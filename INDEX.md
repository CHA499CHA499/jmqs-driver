# Persona Driver 项目内容索引

> 最后核对：2026-08-24。本文以当前工作树中的根 `SKILL.md`、`app/`、`scripts/`、`tests/`、`public/` 与 `package.json` 为真源；历史说明或旧部署与代码冲突时，以代码为准。

## 当前完成度

| 能力 | 代码状态 | 验证状态 |
|---|---|---|
| 新手包、五卡发牌、空工作台、卡架、双棒装配 | 已接线 | 构建与合同测试通过；真实浏览器 5/7/12 卡、拖拽与窄屏回归仍待完成 |
| Persona Run v1/v2、EOF 门、continuation、结果阅读器 | 已接线 | 单元/夹具测试通过；真实 YouNavi 全链路仍待回归 |
| Soul Run、产物校验、卡片投影 | 已接线 | 夹具测试通过；真实 create-soul 交互、产物落地与动态 Skill 索引仍待回归 |
| 本地 supervisor | 已接线 | 进程模型测试通过；HTTP Origin/Token 两项测试在当前沙箱因不可绑定端口而跳过 |
| 公开 Sites | 可构建 | 当前源码不再以线上链接为最新验收对象；公开部署内容边界待主代理确认 |

自动化基线（2026-08-27）：`npm test` 构建成功，104 项测试中 102 通过、2 跳过、0 失败。跳过项均来自真实本地端口绑定测试，不得据此声称 HTTP 运行态已验收。`npm run lint` 为 0 error、18 个既有 `<img>` 性能 warning。

## 目录结构

```text
bridge-persona-atlas-site/
├── SKILL.md                    # YouNavi 导入、检索、安装与使用的根入口
├── app/                         # 浏览器应用与领域模型
│   ├── page.tsx                 # 根编排器：屏幕、Driver、Run、弹层与本机 Bridge
│   ├── driver-*.{ts,tsx}        # Driver 状态类型、二维装配层、闭合层与音频
│   ├── persona-card-*           # 卡片模型、卡面、卡架、编辑器与详情窗
│   ├── persona-management-*     # Prompt/人物/诊断/素材管理中心
│   ├── rod-*                    # 双棒内容模型与注入面板
│   ├── soul-card-*              # Soul 向导、浏览器运行时与投影模型
│   ├── waiting-video-panel.tsx  # 本地 pending/running 等待播放器
│   ├── run-result-*.{mjs,tsx}   # 标题/来源呈现与安全 Markdown 阅读器
│   └── *.module.css/globals.css # 组件与全局视觉合同
├── scripts/
│   ├── persona-local-runtime.mjs    # web + Bridge supervisor
│   ├── persona-navi-bridge.mjs      # 127.0.0.1 HTTP Bridge
│   ├── persona-navi-bridge-lib.mjs  # Persona Run 校验、落盘、CLI、EOF 审计
│   ├── persona-soul-bridge-lib.mjs  # Soul Run 校验、CLI、产物投影
│   └── compose-persona-driver-texture-sprites.py # 离线贴图合成工具
├── tests/                       # Node 测试、源码合同、HTTP/夹具测试
│   └── fixtures/persona-soul-fixture/ # 完整 Soul 产物夹具
├── public/                      # 由 Web 构建直接暴露的静态树
│   ├── personas/                # 当前基线立绘与随机池
│   ├── personas-motion*/        # 开包人物 motion
│   ├── driver-textures/         # 当前 Driver 运行时二维资产
│   ├── audio/                   # cleared 播报与 local-test 声音层
│   ├── waiting-media/           # 当前 480p 本地等待视频与字幕
│   ├── models/persona-driver/   # 历史模型归档说明，不含发布 GLB
│   ├── brand/、cards/           # 当前 Logo 与卡背
│   └── hero-personas.png、og.png
├── worker/index.ts              # vinext/Cloudflare Worker 入口
├── materials/classic-interviews/# 四份内置固定原文与 SHA manifest
├── .agents/skills/persona-driver-setup/ # 根 Skill 调用的确定性安装实现
│   └── assets/persona-skills/           # 五个固定 commit 的离线人物 Skill + 指纹 manifest
├── .openai/hosting.json         # Sites 项目 ID；当前无 D1/R2 绑定
├── package.json                 # 命令与 Node >=22.13.0 合同
├── README.md                    # 使用入口与当前边界
├── INTERFACE.md                 # 外部接口与持久化契约
├── ROLLBACK.md                  # 回退顺序与证据保全
├── CHANGELOG.md                 # 变更历史
└── docs/ARCHITECTURE.md         # 两条本机链路与状态/数据流
```

生成目录 `node_modules/`、`.vinext/`、`dist/`、`.wrangler/`、`.persona-runs/` 不属于源代码索引；其中 `.persona-runs/` 是本机审计数据，必须保留到问题定性完成。

## 模块表

### 浏览器编排与 Driver

| 模块 | 真实职责 | 关键入口/导出 |
|---|---|---|
| `app/page.tsx` | 组织 cover → starter-pack → deal-cards → workbench → management；协调卡片、双棒、Bridge、等待窗、结果窗与本机历史 | `Home`、`startNaviConversation()`、`continueNaviRun()`、`activateDriver()` |
| `app/driver-scene.tsx` | 仅保留 Driver phase 类型；不是视觉渲染器 | `DriverPhase` |
| `app/driver-texture-scene.tsx` | 运行时唯一 Driver 视觉入口；装配人物卡、双棒、闭合层和前景遮罩 | `DriverTextureScene` |
| `app/driver-closure-layer.tsx` | 依据 `handleProgress` 移动左右 chassis，保持核心/卡片固定 | `DriverClosureLayer` |
| `app/interaction-drag-layer.tsx` | 页面级抓取预览层 | `InteractionDragLayer` |
| `app/audio-library.ts` | cleared/local-test 音频资源清单、manifest 合并与 shuffle bag | `getDriverAudioBundleMode()`、`refreshLocalTestManifest()` |
| `app/driver-audio.ts` | Web Audio、同源播报和候选音频的容错播放边界 | `playCardInsertSound()`、`playActivationSequence()`、`stopDriverAudio()` |

### 卡片、管理中心与双棒

| 模块 | 真实职责 | 关键入口/导出 |
|---|---|---|
| `app/persona-card-model.ts` | 基线/自建/Soul 卡数据模型、校验、迁移、localStorage、随机立绘 | `createCustomPersonaCard()`、`readPersonaCardStorage()`、`assignRandomPoolArt()` |
| `app/persona-card-shelf.tsx` | 5/7/12 卡 hand-layout、drag surface 与 inspect 分离 | `PersonaCardShelf` |
| `app/persona-card-editor.tsx` | 自建卡 CRUD、图片校验、随机池接入；固定卡只读 | `PersonaCardEditor` |
| `app/persona-detail-sheet.tsx` | 只提供人物 motion 和立绘放大，不负责插卡/Skill/编辑 | `PersonaDetailSheet` |
| `app/persona-management-page.tsx` | Prompt、人物卡、只读诊断、素材四区管理 | `PersonaManagementPage` |
| `app/persona-management-model.ts` | 管理中心两个独立 localStorage 合同及旧 `normal` 警告 | 存储读写与固定列表 |
| `app/rod-content-model.ts` | 能量棒/技能棒状态、1 MiB 文档、4,000 字 Prompt、v1/v2 请求构建 | `buildPersonaNaviRodRequest()` |
| `app/rod-injector-panel.tsx` | 能量棒固定素材/文档与技能棒固定/custom Prompt 注入 UI | `RodInjectorPanel` |

### Run、Soul 与结果呈现

| 模块 | 真实职责 | 关键入口/导出 |
|---|---|---|
| `app/persona-run-contract.mjs` | 前后端共享的状态标签、结果完整性门和前端恢复建议 | `isCompleteRunCoverage()`、`normalizeRunError()` |
| `app/waiting-video-panel.tsx` | 仅 localhost、receipt 成功且 pending/running 时显示；关闭不取消 Run | `WaitingVideoPanel` |
| `app/run-result-presentation.mjs` | 按任务/指令/来源生成可读标题 | `buildRunResultTitle()` |
| `app/run-result-sheet.tsx` | 仅完整结果可开的居中安全 Markdown 阅读器；诊断折叠、复制、显式打开 YouNavi | `RunResultSheet` |
| `app/soul-card-model.ts` | Soul 向导 schema、隐私/覆盖率校验和卡片投影 | `buildSoulCreateRequest()`、`projectSoulCard()` |
| `app/soul-card-runtime.ts` | 调用 `/soul-runs`、轮询、投影、持久化和 unmapped 安全门 | `executeSoulBridgeRun()` |
| `app/soul-card-wizard.tsx` | 手工卡或 from-soul 交互向导 | `SoulCardWizard` |

### 本机运行时与部署

| 模块 | 真实职责 | 关键入口/导出 |
|---|---|---|
| `SKILL.md` | YouNavi L0 根入口；说明导入、安装、启动、诊断与使用，将 `${SKILL_DIR}` 固定为完整项目根 | `$jmqs-driver` |
| `.agents/skills/persona-driver-setup/scripts/setup.mjs` | 根 Skill 的 doctor/install/start 实现；校验并复制五个离线人物 Skill，不调用 GitHub | CLI `doctor\|install\|start` |
| `.agents/skills/persona-driver-setup/assets/persona-skills/manifest.json` | 固定五个公开来源、commit、tree、文件数、字节数和聚合 SHA-256 | `persona-driver.bundled-persona-skills/v1` |
| `scripts/persona-local-runtime.mjs` | 避免重复占端口，启动 web/Bridge，等待 health，Bridge 异常最多重启 3 次 | `createLocalRuntimeSupervisor()` |
| `scripts/persona-navi-bridge.mjs` | loopback HTTP、Origin/Fetch Metadata/token 门、路由与统一 JSON 错误 | HTTP server on `127.0.0.1:8766` |
| `scripts/persona-navi-bridge-lib.mjs` | Persona manifest、请求冻结、agent-cli、幂等回执、Skill/EOF 证据、continuation | `createPersonaRunService()` |
| `scripts/persona-soul-bridge-lib.mjs` | Soul 输入范围、create-soul 调用、阶段推断、产物完整性/安装检查 | `createPersonaSoulRunService()` |
| `worker/index.ts` | Cloudflare/vinext App Router 与图片优化入口 | default `fetch` |

## 运行状态机

### 页面与 Driver

```text
cover → starter-pack → deal-cards → workbench ↔ management
                                  │
                                  └─ restart → cover

Driver: idle → ready → inserting → locked → activated
                           920ms       │
                                       ├─ 两根棒须先 charged，再拖入正确槽位成为 equipped
                                       └─ 双棒齐备 + 显式按钮/把手阈值 0.72 → activated
```

- `ready` 仅表示选中人物；拖入人物槽后才进入 `inserting`。
- 棒的内容状态为 `empty → draft → charged → equipped`，错误进入 `error`；页面的 `equippedRods` 是实际装配事实，不能用 `charged` 代替。
- 当前 `DRIVER_ACTIVATION_MOTION_ENABLED=false`，Driver 激活动画素材/JSX 保留但不挂载；开包人物 motion 仍启用。

### Persona Run

```text
idle → creating → pending/running ─────────────→ completed
                    │                              │
                    ├→ error                       └→ 结果阅读器（仅 EOF + Markdown）
                    └→ incomplete → continuing → pending/running
                                      └→ stalled/error
```

- YouNavi `finished/success/completed/complete` 都映射到本地终态候选，但还必须通过期望 Skill 激活证据和素材 EOF 证据。
- `incomplete` 不展示最终结论；continuation 必须复用原 conversation，从测得的 `nextOffset` 继续。
- 同一 offset 连续两次无新增覆盖后报 `CONTINUATION_STALLED`。

### Soul Run

```text
collecting → distilling → assembling → validating → ready
     │            │            │             │
     └────────────┴────────────┴─────────────┴→ error
```

浏览器还可附加 `coverage-warning` 与 `index-warning`。`ready` 只表示完整 Soul 产物可投影；当前 `inspectInstalledSoulSkill()` 固定返回动态索引 `unconfirmed`，即使本地文件/frontmatter 正确也保持人物卡 `unmapped`。真实映射能力尚未完成。

## 关键接口

### Local Bridge HTTP

Bridge 固定监听 `127.0.0.1:${PERSONA_NAVI_BRIDGE_PORT:-8766}`。允许 Origin 仅为 `http://localhost:3000` 与 `http://127.0.0.1:3000`；除 `/health` 与 OPTIONS 外均要求 `/health` 返回的进程随机 `X-Persona-Navi-Token`。请求体上限为 4.125 MiB。

| 方法与路径 | Token | 请求/响应 | 副作用 |
|---|---:|---|---|
| `GET /health` | 否 | Bridge、CLI、五 Skill、四素材、create-soul 检查与 token | 只读；会读取本机文件元数据 |
| `POST /runs` | 是 | `persona.navi-run/v1|v2` → `persona.navi-receipt/v1` | 冻结输入、启动 YouNavi、创建 task/conversation |
| `GET /runs/:prun-id` | 是 | 当前状态、Skill/coverage 证据、Markdown/metadata | 查询 CLI；completed 时写 `result.json` |
| `POST /runs/:prun-id/continue` | 是 | continuation receipt | 原 conversation 创建新 task，写 continuation 记录 |
| `POST /runs/:prun-id/open` | 是 | `{ok:true}` | 只执行 `open -a YouNavi`，不是 conversation 深链 |
| `POST /soul-runs` | 是 | `persona.soul-run/v1` → `persona.soul-receipt/v1` | 创建输出目录、冻结输入、创建 create-soul conversation |
| `GET /soul-runs/:psoul-id` | 是 | stage、交互提示或完整 projection | 查询 CLI 并读取 Soul 产物 |
| `POST /soul-runs/:psoul-id/open` | 是 | `{ok:true}` | 只打开 YouNavi 应用 |

### Persona 请求合同

- v1：固定素材 1 篇 + 固定/custom Prompt；`materials` 必须且只能有 1 个白名单 ID。
- v2：单个 `.md/.txt` 文档，UTF-8 实际字节不超过 1 MiB；`materials=[]`。
- Prompt：`review|explain|decision|action|custom`；custom 不超过 4,000 字符；旧 `normal` 明确报错。
- Persona：五张服务端白名单卡；自建/Soul 卡在未映射时只能展示编辑，不能执行。
- 发给 `agent-cli chat send` 的首条文本只含 slash Skill、冻结绝对路径、只读/读到 EOF 安全句、真实 instruction；网页传入的路径或 Skill 名不会直接执行。

### agent-cli 调用

| 操作 | 参数骨架 |
|---|---|
| 认证就绪 | `auth me --no-auto-start --format json`，最长等待 30 秒 |
| 创建 Persona | `chat send <prompt> --task-type chat --source persona-driver --title <title>` |
| 查询任务 | `task show <taskId>` |
| 查询对话 | `convo show <conversationId> --no-paged` |
| continuation | `chat send <prompt> --conversation-id <conversationId> --source persona-driver-continuation` |
| 创建 Soul | `chat send <prompt> --source persona-driver-create-soul --title <title>` |

所有 CLI 通过 `execFile` 参数数组调用，不经过 shell。

## 运行命令

要求 Node `>=22.13.0`。项目以 `package-lock.json` 和 npm 为唯一包管理器合同；不要求 pnpm。

| 命令 | 用途 |
|---|---|
| `npm install` | 安装依赖 |
| `npm run dev` / `npm run dev:persona` | 启动 supervisor：web 3000 + Bridge 8766 |
| `npm run dev:web` | 只启动 vinext web；真实 Run 会报 Bridge offline |
| `npm run navi:bridge` | 只启动本机 Bridge |
| `npm run build` | vinext/Vite/Cloudflare 构建 |
| `npm test` | 先 build，再跑 `tests/*.test.mjs` |
| `npm run lint` | ESLint |
| `npm run start` | 启动已构建产物 |

主要环境变量：

| 变量 | 默认 | 作用 |
|---|---|---|
| `PORT` | `3000` | web 端口；浏览器 Origin 白名单目前仍固定 3000 |
| `PERSONA_NAVI_BRIDGE_PORT` | `8766` | Bridge 与 supervisor 端口 |
| `PERSONA_NAVI_RUN_ROOT` | 项目 `.persona-runs/` | Persona/Soul 审计目录 |
| `PERSONA_NAVI_AGENT_CLI` | 自动探测三种 YouNavi App | agent-cli 覆盖路径 |
| `PERSONA_NAVI_SKILLS_DIR` | `.local/skills` | Skill 根目录；完整运行应在 `.env.local` 指向 YouNavi workspace |
| `PERSONA_NAVI_MATERIAL_ROOT` | `materials/classic-interviews` | 可选覆盖四份内置素材根目录 |
| `PERSONA_NAVI_PRESET_ROOT` | 无 | 旧兼容别名，优先级低于 MATERIAL_ROOT |
| `PERSONA_NAVI_SOUL_WORKSPACE_ROOT` | `.local/soul-workspace` | Soul 输出工作区；可在 `.env.local` 覆盖 |
| `NEXT_PUBLIC_PERSONA_DRIVER_AUDIO_MODE` | localhost 为 `local-test`，其他为 `public-cleared` | 浏览器音频资源层 |

## 测试矩阵

| 测试文件 | 覆盖面 | 非覆盖面 |
|---|---|---|
| `audio-reliability.test.mjs` | 资源分层、shuffle bag、故障隔离 | 真实浏览器音量/授权体验 |
| `driver-closure.test.mjs` | 双棒画布、槽位、闭合层、QA 指标 | 人工视觉观感 |
| `driver-interaction-layout.test.mjs` | drop guide、左右槽、把手布局 | 真实指针/触摸全链路 |
| `pack-motion-state.test.mjs` | 五 motion 映射、跳过/持久化、激活 motion 禁用 | 真机解码与性能 |
| `persona-card-*.test.mjs` | 卡架/详情/CRUD/迁移/随机池/安全门 | 真实 5/7/12 卡浏览器回归 |
| `persona-management-page.test.mjs` | 四分区与依赖注入边界 | 真实存储配额和交互可用性 |
| `rod-content-model.test.*` | 双棒状态、v1/v2、文档/Prompt 校验 | 超大真实文件的浏览器内存行为 |
| `persona-local-runtime.test.mjs` | supervisor 启停、ready、有限重启 | 本机真实进程稳定性 |
| `persona-navi-bridge-http.test.mjs` | Origin alias、token、continuation route | 当前沙箱跳过两项端口绑定测试 |
| `persona-navi-bridge.test.mjs` | 白名单、幂等、CLI 夹具、Skill/EOF、continuation | 真实 YouNavi 账号与对话 |
| `persona-run-contract.test.mjs` | 结果完整性门 | UI 呈现 |
| `persona-soul-bridge.test.mjs` | 范围门、回执、产物夹具、阶段 | 真实 create-soul 运行 |
| `soul-card-model/runtime.test.mjs` | 隐私/覆盖、投影、持久化、unmapped | 动态 Skill 索引成功路径 |
| `waiting-video-panel.test.mjs` | 本地门、媒体合同、清理 | `public/` 是否被部署包排除 |
| `run-result-sheet.test.mjs` | 标题和安全 Markdown 阅读器 | 完整 Markdown 方言 |
| `rendered-html.test.mjs` | 构建产物、资产引用、源码接线合同 | 真实 GUI/可访问性人工验收 |

## 运行数据目录

### 文件系统

```text
.persona-runs/
├── bridge-events.ndjson
├── prun-*/
│   ├── request.json             # 冻结请求、绝对路径、SHA、prompt
│   ├── receipt.json             # task/conversation 与 continuation 游标
│   ├── result.json              # 仅完整成功后写入
│   ├── inputs/<file>            # v2 文档冻结副本
│   └── continuations/NNN.json   # 续读前覆盖与新 task
└── soul/
    └── psoul-*/
        ├── request.json
        ├── receipt.json
        └── inputs/<file>        # 上传 Soul 素材冻结副本
```

Soul 成品不在 `.persona-runs/`：固定写入 `${PERSONA_NAVI_SOUL_WORKSPACE_ROOT}/outputs/persona-souls/{slug}-soul/`。`.persona-runs/` 被 gitignore；其中可能含用户文档正文、绝对路径和 Prompt，不能发布、提交或随意删除。

### 浏览器 localStorage

| Key | 内容 | 清理语义 |
|---|---|---|
| `persona-driver.pack-progress.v1` | 卡包开启、已揭示与已看 motion ID | “重新开始”会删除 |
| `persona-driver.activation-history.v1` | 最多 50 条 Run 摘要，不含正文/token | 只由历史面板显式清理 |
| `persona-driver.persona-cards.v1` | 自建/Soul 卡；上传图片可能以 data URL 持久化 | 卡片管理删除 |
| `persona-driver.custom-personas.v0` | 只读迁移来源 | 读取后迁入 v1，不作为新写目标 |
| `persona-driver.persona-random-pool.v1` | 随机立绘 shuffle bag 游标 | 可单独重置 |
| `persona-driver.prompt-presets.v1` | 自定义 Prompt 预设 | 管理中心 CRUD |
| `persona-driver.custom-materials.v1` | 自定义文本素材 | 管理中心 CRUD；不会删除历史 Run 快照 |

## 资产真源

| 资产 | 当前运行真源 | 状态/边界 |
|---|---|---|
| Driver | `public/driver-textures/assembly/*.png`、charged tight rods、`driver-texture-scene.tsx` | 当前网页只用二维 PNG/CSS；GLB 不加载 |
| 人物基线卡 | `public/personas/*-action-masked-v3.jpg` | 五张固定卡；`public/personas/README.md` 的旧文件表仅作生成历史，不等于当前引用表 |
| 自建/Soul 随机图 | `public/personas/random-pool/masked-bust-v2/manifest.json` | 七张 shuffle-bag fallback；上传图优先 |
| 开包 motion | Naval/Musk 在 `public/personas-motion/`；Jobs/Trump/PG 在 `public/personas-motion-v3-intense/` | 代码锁定混合映射，不可整组互换 |
| Driver 激活 motion | 人物 `motion` 字段与 dormant JSX | 当前全局关闭，不能写成已启用 |
| cleared 播报 | `public/audio/persona-driver-announcer-v2-expressive.m4a` | 同源必需资源；失败回退 Web Audio/TTS |
| local-test 音频 | `public/audio/local-test/manifest.json` 及其文件 | 用户确认是完整项目必需资产；localhost 自动启用 |
| 等待视频 | 中间 6 分钟的 480p MP4 + VTT | 用户确认是完整项目必需资产；完整 480p/720p 版本已在项目外归档 |
| GLB | 项目外历史归档 | 浏览器与发布包均不包含；仓内 README 只保留恢复指针 |
| 固定文本素材 | `materials/classic-interviews/manifest.json` + Bridge `MATERIAL_MANIFEST` | 四份原文随仓；Setup/health 校验 SHA，运行时冻结路径/行数 |
| 固定人物 Skill | Bridge `PERSONA_MANIFEST` + `PERSONA_NAVI_SKILLS_DIR` | 检查 SKILL.md name 与运行时 SHA；manifest 中源 commit 仅作来源记录 |

## 故障码

### 浏览器与请求边界

| Code | 含义 | 处理 |
|---|---|---|
| `BRIDGE_OFFLINE` | 浏览器无法连接 Bridge 的前端归一化码 | 重启 `npm run dev`，再查 health |
| `INVALID_LOCAL_HOST` / `INVALID_REQUEST_ORIGIN` / `CROSS_SITE_REQUEST` | Host、Origin 或 Fetch Metadata 不在白名单 | 不放宽为 `*`；核对 3000↔8766 loopback |
| `INVALID_REQUEST_TOKEN` | 写请求 token 过期/错误 | 重新 `GET /health`；页面会自动重试一次 |
| `REQUEST_TOO_LARGE` / `INVALID_JSON` | HTTP envelope 超限或 JSON 损坏 | 缩小单文档并重建请求 |
| `NOT_FOUND` | 路由不存在 | 核对方法和 ID 格式 |

### Persona Run

| Code | 含义 | 处理 |
|---|---|---|
| `INVALID_RUN` / `INVALID_COMMAND` / `UNKNOWN_*` | schema、ID、白名单或字段不合法 | 修正调用方；不扩大服务端白名单 |
| `INVALID_DOCUMENT` / `DOCUMENT_TOO_LARGE` | 文档名、MIME、UTF-8 字节或内容不合规 | 仅传单个 ≤1 MiB `.md/.txt` |
| `SOURCE_MISSING` / `SOURCE_PATH_NOT_ABSOLUTE` | 固定/冻结素材不可读或路径不绝对 | 修复素材根或重新创建 Run |
| `SKILL_MISSING` | 固定 Persona Skill 未安装/声明名不符 | 安装并检查 SKILL.md name |
| `RUN_CREATION_UNKNOWN` | 已写 request 但无 receipt | 为防重复 conversation 禁止自动重发；先查 YouNavi |
| `INVALID_NAVI_RECEIPT` / `INVALID_RUN_RECORD` | task/conversation 回执或本地记录损坏 | 保留目录取证后新建 Run |
| `SKILL_NOT_ACTIVATED` | 无期望 Skill 结构化/slash 证据 | 不展示结果，检查真实 conversation |
| `SOURCE_NOT_FULLY_READ` | 未读到 EOF | 走 continuation |
| `SOURCE_ALREADY_FULLY_READ` | 对完整 Run 再续读 | 停止 continuation |
| `CONTINUATION_STALLED` | 同 offset 两次无新覆盖 | 重新创建，不猜测 EOF |
| `INVALID_CONTINUATION_RECEIPT` / `CONTINUATION_CONVERSATION_MISMATCH` | continuation 无 task 或换了 conversation | 保留证据并停止续读 |
| `RESULT_TOO_LARGE` | 最终 Markdown 超过 2 MiB | 在 YouNavi 检查输出，不直接放宽 |

### Soul、CLI 与运行时

| Code | 含义 | 处理 |
|---|---|---|
| `INVALID_SOUL_REQUEST` / `INVALID_SOURCE_SCOPE` / `INVALID_OUTPUT_SCOPE` | Soul schema、输入范围或输出目录非法 | 使用精确文件/URL与固定输出根 |
| `PRIVACY_SCOPE_REQUIRED` / `SPEAKER_PURIFICATION_REQUIRED` | 用户范围确认或多人素材纯化缺失 | 回到向导确认，不能绕过 |
| `CREATE_SOUL_SKILL_MISSING` | `create-soul` 未安装或 frontmatter 不符 | 修复 Skill 安装 |
| `SOUL_CREATION_UNKNOWN` / `SOUL_INPUT_CONFLICT` | request 无 receipt 或上传快照冲突 | 禁止自动重发，保留快照核验 |
| `SOUL_ARTIFACT_INCOMPLETE` / `INVALID_SOUL_ARTIFACT` | 缺必需文件、知识/引语/来源不足或 frontmatter 错 | 继续原 conversation 补齐 |
| `AGENT_CLI_MISSING` / `AGENT_CLI_INVALID_RESPONSE` / `AGENT_CLI_FAILED` | CLI 不存在、JSON 无效或命令失败 | 核对 App/CLI/认证，不走 shell 拼接 |
| `NAVI_BACKEND_NOT_READY` / `OPEN_NAVI_FAILED` | App 无法打开或 30 秒内未 ready | 手动启动/认证 YouNavi 后重试 |
| `NAVI_CLI_ERROR` / `PERSONA_NAVI_INTERNAL` | CLI 业务错误或未知 Bridge 错误 | 查回执与 `bridge-events.ndjson` |
| `BRIDGE_RESTART_LIMIT` / `BRIDGE_READY_FAILED` | supervisor 三次重启耗尽或 health 不 ready | 停 supervisor，单独跑 Bridge 定位 |

`BRIDGE_*`、`WEB_*`、`SUPERVISOR_*` 的其余值是 `bridge-events.ndjson` 生命周期事件，不是 HTTP 业务错误。

## 扩展边界

1. 新增固定 Persona 必须同时更新前端 `PERSONAS`、服务端 `PERSONA_MANIFEST`、Skill 安装、资产与测试；不要接受网页传入任意 Skill 路径。
2. 新增固定 Prompt 必须同时更新 `COMMAND_MANIFEST`、`SKILL_PROMPT_PRESETS`、页面文案和测试；custom 仍是唯一自由文本入口。
3. 新增固定素材必须更新前后端双 manifest，并维持“每 Run 恰好一篇”与 SHA/EOF 审计；不要改成目录扫描。
4. 自建/Soul Persona 只有动态 Skill 索引真实验证后才可从 `unmapped` 变为 executable；本地文件存在不足以证明可执行。
5. Bridge 只允许 loopback、固定 Origin、进程 token 和 `execFile`；公开 Worker 不代理本机 Bridge。
6. 结果必须同时满足终态、期望 Skill 证据、完整 EOF coverage 和 Markdown；任何一门失败都不能打开结果阅读器。
7. 管理中心只管理浏览器数据与只读诊断，不取得 workbench、Bridge、Soul 蒸馏或 Run 生命周期所有权。
8. `db/`、D1/R2、starter API 示例未接入；若未来启用，必须先定义数据责任、迁移和隐私边界，不能把模板存在当作能力完成。
9. local-test 音频与等待视频若要求“绝不进入公开包”，需要改构建/资产位置；仅 UI localhost 门控不构成发布隔离。

## 废弃策略

| 已废弃/休眠项 | 当前策略 |
|---|---|
| `normal` Prompt | 新请求返回 `INVALID_COMMAND`；旧棒状态迁移为空并提示重新选择，不静默映射 |
| `decide` 命令 ID | 当前只接受 `decision`；不保留新写兼容 |
| male/female 两个业务空位 | 读取时归一为一个通用空位；不再作为两个入口 |
| `persona-driver.custom-personas.v0` | 仅迁移读取；新数据写 v1 |
| `PERSONA_NAVI_PRESET_ROOT` | 仅环境变量兼容；新文档和配置使用 `MATERIAL_ROOT` |
| `app/driver-scene.tsx` 旧 3D 实现 | 仅保留类型；运行时视觉在 `driver-texture-scene.tsx` |
| GLB/WebGL/Three.js | GLB 仅离线历史源；依赖与浏览器加载链已移除 |
| 旧 sprite/scene 内拖拽/人体底片 | 禁止恢复；统一用组合框三层与 `InteractionDragLayer` |
| Driver 激活 motion | 休眠而非完成；全局开关为 false |
| Sites 旧线上版本 | 历史留档，不代表当前工作树 |

删除废弃兼容前必须先证明无现存 localStorage、环境变量或审计记录依赖，并在 CHANGELOG/ROLLBACK 记录不可逆影响。

## Standalone Repository / Extraction Readiness

### 当前仓库事实

- 目录本身已是独立 Git 仓库：仓根为 `axon/bridge-persona-atlas-site/.git`，当前分支 `yjz/persona-driver-convergence`。
- 远程仓库为公开 `https://github.com/CHA499CHA499/jmqs-driver`，默认分支 `main`；本地 `yjz/persona-driver-convergence` 跟踪 `origin/main`。用户已明确确认随仓等待视频与 local-test 音频一并公开。
- 它在 CHA499 外层仓中表现为一个未跟踪目录，不应把外层仓状态当成该独立仓的提交状态。
- 主功能与收口基线已提交；本轮 Setup Skill、内置材料和 npm supervisor 增量在同一分支形成可审计提交。

结论：已经具备“独立版本历史容器”，但尚未具备“任意机器 clone 后零配置运行”的摘仓完成度。

### 本机硬编码依赖

| 位置 | 当前硬编码/默认 | 摘仓影响 | 应做的环境变量化/配置化 |
|---|---|---|---|
| `scripts/persona-navi-bridge.mjs` | 内置材料 + `.env.local` / `.local/*` | 未配置时仅 Skills/Soul 输出不可用 | Setup 自动推导 YouNavi Skills/Soul workspace；不提交 `.env.local` |
| `persona-navi-bridge-lib.mjs` | 三个 macOS `/Applications/*/agent-cli` 候选 | 非 macOS或自定义安装不可运行 | 已支持 `PERSONA_NAVI_AGENT_CLI`；独立仓 README/启动检查必须将其作为可移植入口 |
| `app/page.tsx`、管理页 | Bridge URL `http://127.0.0.1:8766` | 自定义 Bridge 端口时前后端错配 | 新增公开安全的 `NEXT_PUBLIC_PERSONA_NAVI_BRIDGE_URL`，并校验仍为 loopback |
| Bridge | Origin 白名单固定 web 端口 3000 | `PORT!=3000` 时 CORS 拒绝 | 新增 `PERSONA_NAVI_ALLOWED_ORIGINS` 或由同一 web port 配置生成；不可支持任意 Origin |
| `.openai/hosting.json` | 现有 Sites `project_id` | 摘仓后可能误部署到原项目或无权限 | 首发模板/文档化重绑定流程；是否保留原 ID 由主代理决定 |

已有可用环境变量：`PORT`、`PERSONA_NAVI_BRIDGE_PORT`、`PERSONA_NAVI_RUN_ROOT`、`PERSONA_NAVI_AGENT_CLI`、`PERSONA_NAVI_SKILLS_DIR`、`PERSONA_NAVI_MATERIAL_ROOT`、`PERSONA_NAVI_PRESET_ROOT`、`PERSONA_NAVI_SOUL_WORKSPACE_ROOT`、`NEXT_PUBLIC_PERSONA_DRIVER_AUDIO_MODE`。其中 web 端 Bridge URL 与允许 Origin 仍未跟这些变量联动。

### 运行时与发布边界

- 本机完整运行：Browser → loopback Bridge → agent-cli → YouNavi；需要本机 App、认证、Skills 和真实素材，不是纯 Web 应用。
- 完整独立项目必须携带 local-test 音频和约 50.9 MiB 的 6 分钟 480p 等待视频；公开部署仍需确认其授权边界。
- Soul 输出位于外部 workspace；摘仓不会自动携带或迁移既有 Soul。
- 四份固定原文按用户决定随仓内置；`persona-driver-setup` 在安装前验证 manifest，不再询问材料目录。
- `.persona-runs/` 与浏览器 localStorage 是运行数据，不是可发布种子数据。

### 应排除的本地产物

首次独立仓提交/发布至少排除：

- 已由 `.gitignore` 覆盖：`node_modules/`、`.next/`、`.vinext/`、`dist/`、`.wrangler/`、`.persona-runs/`、`coverage/`、`out/`、`.env*`、`outputs/`、`work/`、日志、`.DS_Store`、`*.pem`。
- 已补充忽略：`tsconfig.tsbuildinfo`；临时端口/进程文件和编辑器本地配置仍不得提交。
- 完整独立仓保留 `audio/local-test/` 与 480p `waiting-media/`；若另行制作公开 demo，应在单独构建配置中排除或替换，而不是从主项目删除。
- 历史 GLB、frames、QA 截图、旧 motion、旧立绘和 720p 备份已迁到 `CHA499/artifacts/persona-driver-convergence/2026-08-21/history/`。
- `.persona-runs/`、已安装 Skills、Soul outputs 绝不能为“让摘仓能跑”而复制进公开仓；四份固定 transcripts 已按用户决定成为随仓资产。

### 首个独立仓库发布检查表

- [ ] 主代理确认仓库名称、license、可见性、默认分支与资产版权边界。
- [x] 主功能、当前资产、测试、INDEX/架构与 Setup Skill 均进入独立分支提交。
- [x] 用户已明确授权创建 remote、push，并在知悉媒体资产会被公开下载后确认切换为 PUBLIC；`origin` 指向 `CHA499CHA499/jmqs-driver`。
- [x] 个人绝对路径默认已移除；`.env.example`、ignored `.env.local` 与 Setup doctor 已提供。
- [x] 统一为 npm，Setup Skill 使用 `npm ci`，supervisor 使用 `npm run dev:web`。
- [ ] 从 clean clone 执行 `npm run build`、`npm test`、`npm run lint`；记录跳过项与原因。
- [ ] 在可绑定端口环境补跑 Origin/Host/token HTTP 测试。
- [x] 当前 YouNavi workspace 的 Web/Bridge 为 200；五人物 Skill、create-soul 和四份内置素材均 ready。
- [ ] 分别完成 Persona v1、v2、EOF continuation 与 Soul 真实回归；不复用会导致重复对话的未知 Run。
- [ ] 决定公开包资产 allowlist/denylist，验证产物不含 local-test、等待视频、GLB/QA、用户输入与绝对路径。
- [ ] 处理 `.openai/hosting.json`：重绑定新项目、模板化或明确保留；不得误推原项目。
- [ ] 扫描 secret、token、个人路径、用户材料、`.persona-runs`、Soul outputs 与超大文件。
- [ ] 校验 README/INDEX/INTERFACE/ARCHITECTURE/ROLLBACK/CHANGELOG 与首发 commit 一致。
- [x] remote 创建、首次 push 与公开可见性均于 2026-08-27 获得用户明确授权；后续 tag 或 Sites 部署仍需单独确认。

## 继续阅读

- [README.md](README.md)：最短运行与验收入口
- [INTERFACE.md](INTERFACE.md)：HTTP、schema、存储和安全契约
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)：Browser → Bridge → agent-cli → YouNavi 两条链路
- [ROLLBACK.md](ROLLBACK.md)：故障隔离与回退
- [CHANGELOG.md](CHANGELOG.md)：按日期追踪变更
