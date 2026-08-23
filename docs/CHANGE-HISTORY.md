# Persona Driver 变更与交互记录

> 审计日期：2026-08-21
> 审计范围：`axon/bridge-persona-atlas-site/`、`brain/workspace/2026-08-19-persona-ride-site-deploy.md`、`brain/workspace/2026-08-20-persona-*.md`
> 当前实现基线：独立仓库 `main@c2db321` 之上的未提交工作树
> 本文件只整理事实与证据，不把计划、对话承诺或历史 `completed` 字段自动升级为当前已验证状态。

## 2026-08-21 收口执行补记

- `verified` — INDEX、架构、资产审计和本文件已经建立；历史 GLB、frames、QA、旧立绘/motion、男女模板媒体与 720p 备份已迁到项目外可恢复归档。
- `verified` — 无运行引用的 DB/Drizzle/D1 starter 已从源码仓移除，依赖与 Worker D1 类型同步清理；TypeScript `--noEmit` 通过。
- `verified` — 批次 A 清理后卡片/HTML/Soul 定向测试 21/21、构建通过；逐文件归档哈希见 `CHA499/artifacts/persona-driver-convergence/2026-08-21/MANIFEST.md`。
- `pending` — 480p 等待视频与 local-test 音频仍在 `public/`，最终是否外置本地挂载等待产品确认。

## 状态口径

| 状态 | 含义 |
|---|---|
| `implemented` | 当前源码或资产中已存在实现；不单独代表运行验收通过。 |
| `verified` | 本次审计直接执行了检查，或存在可定位、与当前合同一致的测试/运行证据。 |
| `pending` | 尚未实现、尚未完成当前口径验收、被环境阻断，或只有历史记录/承诺而缺少足够证据。 |
| `rejected` | 用户明确否决、后续决策明确移除，或当前合同明确禁止恢复的方向。 |

同一能力可以先出现 `implemented`，再出现独立的 `verified` 记录。历史上曾失败、随后修复的事项保留两个时间点，禁止把后来的修复反写成“从未失败”。

## 证据优先级与边界

1. 当前源码、测试和本次只读命令结果。
2. 项目内 QA 图片、metrics、`.persona-runs/` request/receipt/result/continuation 证据。
3. 独立 Git 仓库的 HEAD、status、diff 和提交历史。
4. 指定 workspace 任务记录。
5. `README.md`、`CHANGELOG.md`、`INTERFACE.md`、`ROLLBACK.md` 的叙述。

当低优先级叙述与当前源码或测试冲突时，以当前源码/测试为准，并把文档冲突列为 `pending` 文档债。`.persona-runs/*/result.json` 中的历史 `status=completed` 只代表当时版本的判定，不能自动满足后来新增的 Skill 激活与 EOF 覆盖合同。

## 仓库快照

| 状态 | 事实 | 证据 |
|---|---|---|
| `verified` | Persona Driver 目录是独立 Git 仓库；当前分支 `main`，HEAD 为 `c2db321`（“补齐 Driver 模型与本机预设合同”）。 | `git -C axon/bridge-persona-atlas-site rev-parse --short HEAD`；`git branch -vv` |
| `pending` | 当前实现尚未形成可交付提交：没有 staged 变更，tracked diff 涉及 16 个文件、`4275` 行新增、`2795` 行删除，另有大量未跟踪组件、测试、QA 与资产。 | 独立仓库 `git status --short`、`git diff --stat`、`git diff --cached --name-status` |
| `pending` | CHA499 根仓把整个 `axon/bridge-persona-atlas-site/` 以及本次指定的 workspace 文件视为未跟踪，根仓无法提供这些文件的逐行基线 diff。 | CHA499 根仓 `git status --short -- <scope>` |
| `verified` | tracked diff 没有空白错误。 | 2026-08-21 本次执行 `git diff --check`，退出码 0 |
| `verified` | 当前不构建的测试集合共 102 项：100 通过、0 失败、2 跳过。 | 2026-08-21 本次执行 `node --test tests/*.test.mjs` |
| `verified` | ESLint quiet 模式通过。 | 2026-08-21 本次执行 `npm run lint -- --quiet`，退出码 0 |
| `pending` | 两项 Bridge HTTP 测试因当前沙箱不能绑定本地端口而跳过；不能写成 HTTP 实机已通过。 | `tests/persona-navi-bridge-http.test.mjs` 的本次测试输出 |
| `pending` | 本次未运行 `npm test` / `npm run build`，因为它会重写构建产物，超出“不要修改代码、资产”的侧车约束。历史 workspace 记录的 build 通过仅保留为历史证据。 | `package.json` 中 `test = npm run build && node --test ...` |
| `pending` | 审计时 `127.0.0.1:8766` 没有 listener；本次未创建真实 YouNavi Run。`[::1]:3000` 有既有 web listener，但它不证明 Bridge 可用。 | 2026-08-21 `lsof -nP -iTCP:8766/3000 -sTCP:LISTEN` |

## 需求与交互演进

### 2026-08-19：从公开角色卡 Demo 转向 Persona Driver

| 状态 | 决策 / 变化 | 来源与追溯 |
|---|---|---|
| `implemented` | 最初目标是把 YouNavi DevTools 的“同事角色卡”Demo 做成独立站，保留冷启动、选角、组队、模拟会审和结果展示，不接真实飞书/后端。随后按用户要求从私有切为公开，记录的历史地址为 `https://tongshi-role-cards.carver-wiseylq.chatgpt.site`。 | `brain/workspace/2026-08-19-persona-ride-site-deploy.md` |
| `pending` | 上述 URL 与 Sites v1 是历史发布记录，本次未联网回读；当前 README 明确“本地源码为唯一真源，不再更新公开测试链接”，因此不能把旧公开站写成当前实现。 | workspace 发布章节；`README.md`“音频可靠性 P0”后的开发状态说明 |
| `implemented` | 产品形态演进为固定五人 Persona Driver：Naval、Elon Musk、Steve Jobs、Donald Trump、Paul Graham；人物卡、Driver、双棒、Bridge 成为主线。 | `README.md`“Persona Driver v1”；`CHANGELOG.md` 2026-08-19 |
| `rejected` | 浏览器运行时 Three.js/WebGL/GLB、人物身体底片和重复的 3D/2D 视觉真源被移除；GLB 只保留为离线/回退源资产。 | `README.md`“全量清洗后的前端真源”；`INTERFACE.md`“二维逐帧运行合同”；`app/driver-scene.tsx`、`package.json` |
| `implemented` | 原始素材与 Prompt 从常驻侧栏迁移为两根棒的注入流程：先注入、再 charged、人物卡 locked 后拖入正确槽位成为 equipped。 | `brain/workspace/2026-08-20-persona-driver-layout-rod-fix.md`；`app/page.tsx`；`app/rod-content-model.ts` |
| `rejected` | 空棒直接装配、charged 自动等于 equipped、点击空棒直接插入 Driver 的路径被否决。 | `brain/workspace/2026-08-20-persona-driver-state-machine.md`；`INTERFACE.md`“页面 → Bridge”末项 |
| `implemented` | 页面级 `InteractionDragLayer` 成为人物卡与双棒唯一跟手层；来源只显示 lifted 状态，Driver 只负责命中。 | `app/interaction-drag-layer.tsx`；workspace layout/rod 记录 |
| `rejected` | 浏览器原生图片拖拽、每个组件各自维护跟手副本、旧 `.texture-driver-held` 场景内副本被移除。 | `README.md`“全量清洗后的前端真源”；`ROLLBACK.md`“图层漂移紧急处理” |
| `implemented` | 本机 Persona Navi Bridge 接入固定五个 Skill 与四份真实 TXT；证据写入 gitignored `.persona-runs/`。 | `scripts/persona-navi-bridge*.mjs`；`INTERFACE.md`“Navi Bridge 运行合同” |

### 2026-08-20：入口、管理、结果和语义安全收口

| 状态 | 决策 / 变化 | 来源与追溯 |
|---|---|---|
| `rejected` | 卡包选择页、唯一选项确认和强制按顺序逐张揭晓被移除。 | `CHANGELOG.md`“新手卡包路径”“开包任意翻卡”；`app/page.tsx` |
| `implemented` | 当前入口为 cover → starter-pack → deal-cards；任意未翻卡可播放自己的 motion，右下角可一次跳过全部，完成态刷新后仍停留五卡页面，用户确认后才进入工作台。 | `app/page.tsx` 的 `revealPackCard/revealAllPackCards`；`tests/pack-motion-state.test.mjs` |
| `verified` | 任意翻卡、skip-all 持久化、资源映射、reduced-motion/static fallback 与 Driver motion 禁用合同在本次测试中通过。 | `tests/pack-motion-state.test.mjs`；本次 102 项测试结果 |
| `implemented` | 五人 motion 当前固定为 Naval/Musk 的旧 motion，Jobs/Trump/Paul Graham 的 intense v3；七条 intense v3 资产虽均生成，Musk 与 female 在生产 workspace 中被标为视觉硬约束失败。 | `brain/workspace/2026-08-20-persona-card-motion-v3-action-masked-intense.md`；`app/page.tsx`；`tests/pack-motion-state.test.mjs` |
| `rejected` | Musk intense v3 不接入五人开包基线；female intense v3 不作为当前五人开包资源。它们保留为资产/QA 记录，不因文件存在而视为批准接入。 | motion workspace 的 5 通过/2 失败记录；`INTERFACE.md` Pack motion 映射 |
| `rejected` | Driver 合体视频在当前版本暂停：`DRIVER_ACTIVATION_MOTION_ENABLED=false`，不 mount、不 autoplay、不显示视频诊断。开包 motion 独立保留。 | `app/page.tsx`；`CHANGELOG.md`“暂停 Driver 合体视频”；`tests/pack-motion-state.test.mjs` |
| `implemented` | 管理中心采用用户已确认的“独立全屏页”，按 Prompt、人物卡、状态检测、素材四类对象分区；不是弹窗或抽屉。 | `brain/workspace/2026-08-20-persona-driver-management-page.md`；`app/persona-management-page.tsx` |
| `rejected` | 管理中心弹窗/抽屉方向被否决；运行操作继续留在工作台。 | management workspace“目标与决策” |
| `implemented` | 管理页最初“本地完成、未接线”，后续已由 `app/page.tsx` 接入，齿轮进入 prompts，Shelf 管理入口进入 cards，返回不 reset 工作台。 | management workspace 的“未完成/集成边界”；后续 state-machine workspace；`app/page.tsx` |
| `verified` | 管理页接线、四分区、Soul 依赖注入和不接管工作台/Bridge 的边界通过当前 fixture 测试；QA 目录含桌面与窄屏截图。 | `tests/persona-management-page.test.mjs`；`persona-management-qa/` |
| `implemented` | male/female 两个模板收敛为唯一通用空位卡 `custom-template-empty-v1`；空位不可拖拽、不可 inspect、不可插卡，点击/Enter 进入 creating。 | `app/persona-card-model.ts`；`app/persona-card-shelf.tsx`；state-machine workspace |
| `rejected` | 工作台和管理页同时展示 male/female 两张业务空位卡的旧合同被移除；旧 ID 只作为迁移输入。 | `tests/persona-card-model.test.mjs`；`CHANGELOG.md`“人物详情与空位卡” |
| `implemented` | 人物详情只保留“播放人物动画 / 放大查看立绘”；结果窗口与人物详情是两个独立开关。 | `app/persona-detail-sheet.tsx`；`app/page.tsx`；`tests/persona-card-components.test.mjs` |
| `rejected` | 在人物详情中继续承载 Skill、编辑、插卡、播报、新建等操作被移除；插卡只来自卡面 drag surface 的正确命中。 | state-machine workspace；`ROLLBACK.md`“人物详情与空位卡 P0 回退” |
| `implemented` | `RunResultSheet` 从右侧栏收敛为遮罩内居中大窗，桌面最大 1180px/88dvh，工程 ID、路径、SHA、Skill 默认折叠。 | `app/run-result-sheet.tsx`、CSS；`persona-card-qa/run-result-centered-1440.png` |
| `rejected` | “打开 YouNavi”不再写成发送内容或精确 conversation 深链；接口只启动已有 YouNavi 应用。receipt 后自动打开也被移除。 | `CHANGELOG.md`“结果窗口信息架构”“等待长视频”；`INTERFACE.md` `/runs/<runId>/open` |
| `implemented` | Soul 一键导入通过 `/soul-runs` 接入管理页；本地文件校验与动态 Skill 索引验证分离。索引未确认时卡片保持 unmapped。 | `app/soul-card-*`、`scripts/persona-soul-bridge-lib.mjs`；state-machine workspace |
| `rejected` | 本地 `SKILL.md`/frontmatter 正确不等于动态索引成功；禁止把未确认索引的 Soul 卡标为 mapped。 | `CHANGELOG.md`“中央结果窗与 Soul 一键导入集成验收” |
| `implemented` | Bridge 发送文本收敛为 slash Skill、绝对路径、真实 instruction 三段；内部元数据留在本地 request/result，不发送给模型。 | `scripts/persona-navi-bridge-lib.mjs`；`tests/persona-navi-bridge.test.mjs` |
| `rejected` | 旧长 Prompt 合同、把文档正文塞入 CLI prompt、固定写死测试任务被移除。 | navi-bridge RCA“语义链路补充”；`ROLLBACK.md`“YouNavi 三段式”相关条目 |
| `implemented` | Bridge 必须以结构化 Skill 激活证据和 source EOF 覆盖决定 completed；partial read 返回 `SOURCE_NOT_FULLY_READ`，可在同一 conversation continuation。 | `scripts/persona-navi-bridge-lib.mjs`；`app/persona-run-contract.mjs`；`app/page.tsx::continueNaviRun` |
| `rejected` | 模型正文自称激活 Skill、普通文本出现 slug、只读首 200 行，都不能再作为 completed 证据。 | navi-bridge RCA；`tests/persona-navi-bridge.test.mjs` |
| `implemented` | `pnpm dev` 与 `pnpm dev:persona` 均进入 supervisor，`dev:web` 保留裸 web；supervisor 等 Bridge health ready，并有限重启。 | `package.json`；`scripts/persona-local-runtime.mjs` |
| `implemented` | 本地 pending/running Run 挂载 480p `WaitingVideoPanel`；terminal/error/incomplete 关闭，关闭/最小化不取消 Run，公开运行不渲染。 | `app/waiting-video-panel.tsx`；`app/page.tsx` |
| `verified` | 480p 媒体当前通过 H.264/AAC stereo/full-duration/faststart 测试，修复了 workspace 中早期 “moov atom not found” 阻断。 | `tests/waiting-video-panel.test.mjs` 本次通过；state-machine workspace 保留早期失败记录 |

## 当前实现摘要

| 状态 | 能力 | 当前事实源 |
|---|---|---|
| `implemented` | 入口与卡包 | `app/page.tsx`；`PACK_PROGRESS_KEY=persona-driver.pack-progress.v1` |
| `implemented` | 五张固定卡 + 一个通用空位、自定义卡持久化与随机立绘池 | `app/persona-card-model.ts`、`persona-card-editor.tsx`、`persona-card-shelf.tsx` |
| `implemented` | 二维 Driver、左右 `SideChassisAssembly`、tight rod sprite、页面级统一抓取 | `app/driver-texture-scene.tsx`、`driver-closure-layer.*`、`interaction-drag-layer.tsx` |
| `implemented` | 四项固定 Prompt（review/explain/decision/action）+ custom；单文档 v2 | `app/rod-content-model.ts`、`rod-injector-panel.tsx` |
| `implemented` | 独立管理中心与 Soul 创建入口 | `app/persona-management-page.tsx`、`soul-card-*` |
| `implemented` | 本机 Bridge v1/v2、Skill/EOF 语义审计、continuation、结果阅读器 | `scripts/persona-navi-bridge*.mjs`、`app/persona-run-contract.mjs`、`run-result-*` |
| `implemented` | 本机等待视频、唤起历史、显式打开 YouNavi | `app/waiting-video-panel.tsx`；`ACTIVATION_HISTORY_KEY=persona-driver.activation-history.v1` |
| `implemented` | 原创同源播报 + Web Audio fallback；local-test Decade 候选有独立 manifest 和 shuffle bag | `app/audio-library.ts`、`app/driver-audio.ts`、`public/audio/` |
| `pending` | `candidate-17`–`candidate-40` 只在指定 workspace 中记录为外部本机候选，明确未复制到项目 `public/audio/`、未接应用。受本次范围限制未读取外部 `outputs/`，因此不做独立复验。 | `brain/workspace/2026-08-20-persona-driver-decade-audio-candidates.md` |

## 当前验证证据

### 本次直接执行

- `verified` — `node --test tests/*.test.mjs`：102 tests，100 pass，0 fail，2 skipped；耗时约 10.18s。
- `verified` — `npm run lint -- --quiet`：退出码 0。
- `verified` — `git diff --check`：退出码 0。
- `pending` — 未执行会写构建产物的 `npm test` / `npm run build`。

### 已落盘证据

- `verified` — `persona-card-qa/`、`persona-management-qa/`、`public/driver-textures/qa/` 当前合计 109 个文件；测试已验证其中关键几何、timeline、结果窗和管理页合同。
- `verified` — `.persona-runs/` 当前有 40 份 receipt、9 份 result、4 份 continuation 记录，证明历史上发生过本机 Run/续读流程。
- `pending` — 9 份历史 result 虽都写有 `status=completed`，但 8 份没有当前 `metadata.coverage`，9 份都没有顶层 `skillEvidence`；只有 `prun-9dbb8fe1-d733-43f7-89ec-fdba398c207d` 的 result 含 `eof=true` coverage。它们不能整体升级为当前语义合同下的 verified completed。
- `rejected` — `prun-c08b85ef-1d59-4be1-bb54-be641fab37bf` 的旧 result 仍标 completed，但 RCA 已证明只读了约 1600 行中的前 200 行；当前合同应判 `SOURCE_NOT_FULLY_READ`。保留旧文件作为历史证据，不篡改它。

## 已知阻断与待办

| 状态 | 阻断 / 风险 | 影响与下一证据 |
|---|---|---|
| `pending` | 当前工作树规模大且全部未提交/未暂存。 | 无法把“当前实现”绑定到稳定 commit；收口前需由主线所有者分组审查、提交并记录提交号。 |
| `pending` | 最新源码没有对应最新公开部署证据。 | 旧 Sites v1 仅作历史留档；如要宣称上线，需部署后回读真实 URL 和版本。 |
| `pending` | 当前 8766 Bridge 离线，且 2 项端口测试在沙箱跳过。 | 需在可绑定端口环境执行 loopback alias、token、evil Origin/Host 测试；若做真实 Run，必须单独记录并避免重复创建。 |
| `pending` | 架构审查要求的完整 1440/1792 状态矩阵没有闭环。 | 现有 1792/2560 证据只覆盖 rod 几何子集；仍需空载、插卡、单棒、双棒 0/25/50/75/100、activated、reduced-motion 全矩阵。 |
| `pending` | `app/globals.css` 仍有全局 `.texture-driver-rod`/`texture-driver-rod-insert`，局部 module 也定义 `.rodSprite` 与插入动画。 | architecture review 指出的“双 geometry/motion owner”尚未彻底消除；需先统一合同再删除旧规则。 |
| `pending` | Driver geometry 仍在 CSS 中硬编码槽轴、window、shift、rotation；未完全由 manifest 生成。 | `driver-closure-layer.module.css` 中 `27.55%/72.45%/6.76%/52.2%/10.5%/2.6deg` 仍是独立事实源。 |
| `pending` | 视觉 activated 仍与 Bridge receipt 耦合：本机只有 `/runs` 成功后 `setPhase("activated")`，失败会 `updateHandleProgress(0)`。 | architecture review 的“视觉 phase 与网络状态解耦”尚未完成；公开 demo 分支例外会直接 activated。 |
| `pending` | 25/50/75% 合拢仍不是可停留的产品状态。 | 现有 QA 有 timeline 截图，但产品 pointerup 低于阈值会回零；需要专用 QA 驱动和可读 `data-close-progress` 才能完成矩阵。 |
| `pending` | 当前文档存在互相冲突的旧叙述。 | 本文件作为索引，不擅自覆盖并行修改；见下一节逐项清单。 |

## 现有文档审计

### README.md

- `pending` — 前段仍写“翻牌与 Driver 合体均播放真实 motion video”，但顶部和当前代码明确 Driver motion 已禁用；当前事实是“Pack enabled、Driver disabled”。
- `pending` — “没有文件上传、第三方连接器”适用于公开 Demo，但后文又描述本机 v2 文档与 YouNavi Bridge。需要把“公开运行边界”和“localhost 完整运行边界”拆成两个明确章节。
- `pending` — 目录项仍称 `app/` 为“公开 Demo iframe”，而当前页面已是直接组件化应用，`public/persona-atlas.html` 也在 tracked diff 中删除。

### CHANGELOG.md

- `verified` — 关键修复均有条目，能还原同日多次方向变化，包括 Driver motion 先启用后暂停、waiting 480p 先组件后接线、management 先未接线后集成。
- `pending` — 文件存在重复日期标题、孤立的 `+` 前缀和互相覆盖的旧条目；它适合保留原始流水，不适合单独充当当前真源。
- `pending` — 本次不修改该文件，避免覆盖现有 218 行新增/1 行删除的并行未提交变更。

### INTERFACE.md

- `verified` — Bridge v1/v2、EOF、Skill evidence、continuation、结果窗和 storage key 的主要合同已与当前源码对应。
- `pending` — 旧段落仍写人物详情可“插入、复制/编辑和新建空卡”，后段及当前组件则只允许 motion/art preview。
- `pending` — “构建输出/浏览器状态”段落写 `sessionStorage`，当前实际使用多个 `localStorage` key。
- `pending` — 音频旧合同写公开环境只用 Web Audio/TTS、不读音频文件，当前实现和同文后段又规定必需同源 M4A；应以 `app/driver-audio.ts` 与音频测试为准。
- `pending` — SideChassisAssembly 旧段写 canonical 1024×1536，顶部 RodSprite 合同和当前代码使用 tight 256×1500；旧段需要显式标注 superseded。

### ROLLBACK.md

- `verified` — 已覆盖 Driver motion pause、audio shuffle bag、SideChassis、waiting video、management、Bridge、continuation 和隐私下线边界。
- `pending` — 仍混有已拒绝路径的旧回退建议（pack selection、旧 motion、Three.js、8765 音频服务等），且存在重复一级标题和编号跳项。执行回退时必须优先匹配当前功能顶部条目，不能从文件中随机选旧段。

### workspace 任务

- `verified` — state-machine workspace 诚实保留了“先失败、后修复”的中间状态，是需求演进的重要证据。
- `pending` — management workspace frontmatter 仍为 `completed-local-not-integrated`，已被后续 page 接线事实取代；本次不反写旧记录。
- `pending` — layer architecture review 是 review/任务书，不是实现完成证明；其 G1–G6 只能按当前源码逐项核验。
- `pending` — 2026-08-19 deploy workspace 的“源码隔离在 visualization、不改 CHA499”只描述最初站点，不适用于当前位于 CHA499 `axon/` 的 Persona Driver 独立仓库。

## 明确否决方向汇总

- `rejected` — 用弹窗/抽屉承载统一管理中心。
- `rejected` — 恢复 pack selection、唯一选项确认或强制顺序翻卡。
- `rejected` — 工作台展示 male/female 两张业务空位。
- `rejected` — 浏览器恢复 Three.js/WebGL/GLB 或隐藏人物身体底片。
- `rejected` — 把 card/rod 烘焙回腰带底图，或恢复多套拖拽副本。
- `rejected` — 空棒可装配、charged 自动视为 equipped。
- `rejected` — 新建 Run 恢复已移除的 normal Prompt。
- `rejected` — 把 Persona/Command/Run/task、正文、SHA 等旧长合同重新发送给模型。
- `rejected` — 用模型自述、普通 slug 文本或部分读取冒充 Skill 激活与 EOF 完成。
- `rejected` — receipt 后自动打开 YouNavi，或把“打开 YouNavi”宣传成发送/精确 conversation 深链。
- `rejected` — 在当前版本恢复 Driver 合体视频；恢复必须另行评审并提供按钮/handle 真实播放证据。
- `rejected` — 将未经接入确认的 candidate-17–40 或受保护影视原声直接打包到公开站。

## 来源索引

- 项目文档：`README.md`、`CHANGELOG.md`、`INTERFACE.md`、`ROLLBACK.md`。
- 当前实现：`app/`、`scripts/`、`tests/`、`package.json`。
- 运行证据：`.persona-runs/`、`persona-card-qa/`、`persona-management-qa/`、`public/driver-textures/qa/`。
- 初始发布：`brain/workspace/2026-08-19-persona-ride-site-deploy.md`。
- intense v3 资产：`brain/workspace/2026-08-20-persona-card-motion-v3-action-masked-intense.md`。
- Decade 候选：`brain/workspace/2026-08-20-persona-driver-decade-audio-candidates.md`。
- 图层架构审查：`brain/workspace/2026-08-20-persona-driver-layer-architecture-review.md` 及其 `evidence/`。
- 左侧布局/棒体：`brain/workspace/2026-08-20-persona-driver-layout-rod-fix.md`。
- 管理中心：`brain/workspace/2026-08-20-persona-driver-management-page.md`。
- 交互状态机与集成：`brain/workspace/2026-08-20-persona-driver-state-machine.md`。
- Bridge RCA：`brain/workspace/2026-08-20-persona-navi-bridge-rca.md`。
