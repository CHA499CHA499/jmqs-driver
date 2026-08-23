# Persona Driver 对外接口契约

> 核对日期：2026-08-21。调用方是浏览器页面与本地开发者；被调用方是 Local Bridge、agent-cli、YouNavi、浏览器 localStorage 和本机文件系统。

## 1. 运行入口

| 入口 | 行为 | 边界 |
|---|---|---|
| `npm run dev` / `pnpm dev:persona` | supervisor 启动/复用 web 3000 与 Bridge 8766 | 依赖本机 `pnpm` 子进程 |
| `npm run dev:web` | 只启动 vinext web | 不提供真实 Persona/Soul Run |
| `npm run navi:bridge` | 只启动 `127.0.0.1:8766` Bridge | 不启动 web |
| `npm run build` | 构建 vinext/Cloudflare 产物 | `public/` 被视为静态树 |
| `npm test` | build + Node tests | 不等价于真实 GUI/YouNavi 验收 |

Node 版本合同为 `>=22.13.0`。

## 2. Browser → Local Bridge

### 2.1 网络与认证

- 地址：`http://127.0.0.1:${PERSONA_NAVI_BRIDGE_PORT:-8766}`。
- 监听：仅 `127.0.0.1`。
- 允许 Host：当前端口的 `localhost`、`127.0.0.1`、`[::1]`。
- 允许 Origin：`http://localhost:3000`、`http://127.0.0.1:3000`。
- 允许 Fetch Metadata：same-origin、same-site、none；另允许上面两个 Origin 与 Bridge Host 之间的明确 loopback alias。
- token：`GET /health` 返回进程随机 token；其余 Run/Soul 路由通过 `X-Persona-Navi-Token` 提交。
- body：最大 `4 * 1 MiB + 128 KiB = 4.125 MiB`。
- CORS：只回显白名单 Origin，禁止 `*`。

Bridge 重启后 token 会变化。浏览器遇到一次 `INVALID_REQUEST_TOKEN` 会重新请求 `/health` 并重放原请求一次；token 不持久化。

### 2.2 通用响应

成功响应至少含：

```json
{ "ok": true }
```

错误响应：

```json
{
  "ok": false,
  "code": "ERROR_CODE",
  "error": "面向诊断的短错误"
}
```

错误文本最多 1,200 字符；未知错误使用 `PERSONA_NAVI_INTERNAL`。

## 3. HTTP 路由

### `GET /health`

不需要 token，但仍执行 Host/Origin/Fetch Metadata 门。

响应字段：

```json
{
  "ok": true,
  "service": "persona-navi-bridge",
  "token": "process-random-token",
  "cliAvailable": true,
  "skills": {
    "naval": { "installed": true, "skillName": "naval-perspective", "sha256": "...", "lineCount": 123, "error": null }
  },
  "materials": {
    "jobs-gates-d5": { "available": true, "path": "/absolute/file", "size": 123, "sha256": "...", "lineCount": 456 }
  },
  "soul": {
    "createSoul": { "installed": true, "skillName": "create-soul", "skillPath": "/absolute/SKILL.md", "sha256": "..." }
  }
}
```

此接口只读检查，不创建 task/conversation。

### `POST /runs`

创建 Persona Run；要求 token。

v1 固定素材：

```json
{
  "schema": "persona.navi-run/v1",
  "runId": "prun-<12..72 chars>",
  "personaId": "jobs",
  "task": "评审所选素材……",
  "commandId": "review",
  "materials": ["jobs-gates-d5"]
}
```

v2 自定义文档/custom Prompt：

```json
{
  "schema": "persona.navi-run/v2",
  "runId": "prun-<12..72 chars>",
  "personaId": "jobs",
  "task": "……",
  "commandId": "custom",
  "customPrompt": "……",
  "materials": [],
  "document": {
    "name": "input.md",
    "mimeType": "text/markdown",
    "size": 123,
    "content": "# content",
    "summary": "调用方摘要；服务端会重算"
  }
}
```

服务端约束：

- `runId`：`^prun-[a-z0-9-]{12,72}$`，总输入清理上限 80 字符。
- `personaId`：`naval|musk|jobs|trump|pg`。
- `commandId`：`review|explain|decision|action|custom`；`normal` 返回 `INVALID_COMMAND`。
- `task` 与 custom Prompt：各 ≤4,000 字符。
- v1 恰好 1 个白名单素材 ID；v2 恰好 1 个文档且 `materials=[]`。
- 文档：单文件名、无 `/`/`\`/穿越、`.md|.txt`、允许 MIME 为 `text/plain|text/markdown`、UTF-8 实际字节与 `size` 一致且 ≤1 MiB、内容非空且无 NUL。
- 固定命令不能携带 `customPrompt`。

成功响应：

```json
{
  "ok": true,
  "schema": "persona.navi-receipt/v1",
  "runId": "prun-...",
  "personaId": "jobs",
  "skillName": "steve-jobs-perspective",
  "skillSha256": "...",
  "commandId": "review",
  "taskId": "...",
  "conversationId": "...",
  "status": "pending",
  "createdAt": "ISO-8601"
}
```

幂等键为 `runId`。已有完整 receipt 返回同一回执并标记 `idempotent:true`；已有 request 但无 receipt 返回 `RUN_CREATION_UNKNOWN`，禁止自动重发。

### `GET /runs/:runId`

要求 token。状态响应可能为：

- `pending|running`：任务未结束。
- `error|cancelled`：返回真实 task 错误。
- `error + SKILL_NOT_ACTIVATED`：没有期望 Skill 激活证据。
- `incomplete + SOURCE_NOT_FULLY_READ`：返回 `coverage` 与 continuation 描述。
- `completed`：返回 `contentMarkdown`、`coverage`、`metadata` 并写 `result.json`。

`completed` 的必要条件：YouNavi 终态、期望 Skill 证据、完整连续 EOF coverage、当前 task 的完整 assistant 消息、结果 ≤2 MiB。

coverage 项：

```json
{
  "mode": "source|document",
  "sourceName": "人类可读来源",
  "technicalName": "真实文件名",
  "path": "/frozen/absolute/path",
  "sha256": "...",
  "readLines": 100,
  "totalLines": 100,
  "nextOffset": 100,
  "eof": true,
  "reason": null,
  "chunks": [{ "start": 0, "end": 100 }]
}
```

### `POST /runs/:runId/continue`

要求 token。只允许已有完整 request/receipt 的 Run；必须复用原 `conversationId`，从 coverage 的 `nextOffset` 续读。

成功时更新 `receipt.json` 的 `taskId/taskIds/continuationCount/continuationOffsets`，并写 `continuations/NNN.json`。同一 offset 在历史中已出现两次时返回 `CONTINUATION_STALLED`；已 EOF 返回 `SOURCE_ALREADY_FULLY_READ`。

### `POST /runs/:runId/open`

要求 token。仅执行 `open -a YouNavi`，不定位到指定 conversation，不重发任务。

### `POST /soul-runs`

要求 token。schema 固定为 `persona.soul-run/v1`，`mode=from-soul`。

核心字段：

```json
{
  "schema": "persona.soul-run/v1",
  "runId": "psoul-...",
  "mode": "from-soul",
  "personName": "人物名",
  "oneLineDescription": "一句话描述",
  "targetType": "self|other",
  "sourceMode": "selected-materials|uploaded-files|younavi-context|public-research",
  "exactMaterialPaths": ["/one/exact/file"],
  "fixedMaterialIds": [],
  "uploadedMaterials": [],
  "publicSources": [],
  "collectionScope": {
    "confirmed": true,
    "scopeText": "允许范围",
    "exclusionsText": "排除范围",
    "speakerPurificationRequired": false,
    "speakerPurificationConfirmed": false
  },
  "outputSlug": "person",
  "outputDir": "outputs/persona-souls/person-soul",
  "materialCount": 5,
  "totalWordCount": 10000
}
```

约束：

- 本地路径必须是单个规范化绝对文件；禁止 glob、目录、`..`、vault、`/Users` 和用户主目录范围。
- `self` 非公开研究必须提供明确本地输入；`other` 只允许上传或公开 URL，不能读固定工作区素材。
- `public-research` 必须至少一个 http(s) URL，且不能混本地输入。
- 必须显式确认采集范围；多人素材要求发言人纯化确认。
- 输出目录必须由 Bridge 归一为 `outputs/persona-souls/{slug}-soul`。

成功回执：`persona.soul-receipt/v1`，包含 `runId/taskId/conversationId/stage/outputDir/outputSlug/personName`，并标记 `interactive:true`、`requiresUserConversation:true`。

### `GET /soul-runs/:runId`

要求 token。返回 `collecting|distilling|assembling|validating|ready|error` 与阶段摘要。

产物尚未完整时可返回：

- `artifactPending:true`
- `needsUserInput:true|false`
- `detail`：要求在原 YouNavi conversation 回答或继续等待。

ready 时返回 projection；其完整性要求：

- 必需：`SKILL.md`、`_persona/rules.md`、`communication.md`、`values.md`、`_quotes/iconic.md`、`_meta/sources.md`。
- `_knowledge/*.md` 至少 2 个。
- 代表性引语至少 20 条，来源至少 1 条。
- SKILL frontmatter `name={slug}-chat` 且有 description。

`installVerification.fileVerified=true` 仍不等于动态索引成功。当前实现返回 `verified:false/indexStatus:unconfirmed`，浏览器必须把卡保持 `unmapped`。

### `POST /soul-runs/:runId/open`

要求 token。只打开 YouNavi App，不修改 Soul Run。

## 4. Bridge → agent-cli → YouNavi

CLI 候选按顺序：

1. `PERSONA_NAVI_AGENT_CLI`（如设置）
2. YouNavi App
3. YouNavi Internal App
4. YouNavi Debug App

所有调用使用 `execFile(cli, argv)`，不经过 shell。CLI 输出必须为 JSON；maxBuffer 16 MiB，默认 timeout 90 秒。

创建前 Bridge 会 `open -a YouNavi`，并在 30 秒内每 750 ms 调用 `auth me` 等待后端与认证 ready。

Persona 首条消息只含：

1. `/<manifest skill>`
2. 只读且必须完整读到 EOF 的安全句
3. Bridge 冻结的绝对文件路径
4. manifest/custom instruction

网页提供的 Skill 路径、CLI 参数、输出目录不会直接进入执行参数。

Soul 首条消息以 `/create-soul <person>` 开始，列出明确输入、隐私/纯化边界、固定输出目录和 Step 1–5；Step 6 安装前必须在 YouNavi 中请求用户确认。

## 5. 浏览器组件接口

| 组件 | 输入/输出边界 |
|---|---|
| `PersonaCardShelf` | 输入卡列表与选中 ID；输出 drag、inspect、manage；模板卡不拖拽/inspect |
| `PersonaCardEditor` | 管理自建卡 localStorage；固定卡只读；不会改 activation history |
| `PersonaManagementPage` | 四区管理与只读诊断；`onBack` 返回；不拥有 workbench/Bridge 生命周期 |
| `RodInjectorPanel` | 输出合法 `RodContentState`；不直接调用 Bridge |
| `WaitingVideoPanel` | 仅 local + accepted receipt + pending/running；close/minimize 不取消 Run |
| `RunResultSheet` | 只接收已通过上游门的 Markdown；安全结构化渲染；显式 `onOpenInYouNavi` |
| `SoulCardWizard` | 构造隐私受限请求；bridge 模式轮询并在完整投影后写卡 |

## 6. 持久化接口

### `.persona-runs/`

- `bridge-events.ndjson`：supervisor/Bridge 生命周期，禁止写 token、正文或 Prompt。
- `prun-*/request.json`：冻结输入、绝对路径、SHA、lineCount、prompt/title。
- `prun-*/receipt.json`：task/conversation 与 continuation 状态。
- `prun-*/inputs/`：v2 文档正文快照。
- `prun-*/continuations/`：每次 continuation 证据。
- `prun-*/result.json`：仅完整成功结果。
- `soul/psoul-*`：Soul 请求、回执与上传输入。

此目录不属于公开输出，但包含敏感输入与路径；禁止提交、发布或在回退时删除。

### Soul 输出

`${PERSONA_NAVI_SOUL_WORKSPACE_ROOT}/outputs/persona-souls/{slug}-soul/` 由 create-soul 写入。站点代码只读取校验与投影，不拥有删除权。

### localStorage

| Key | Schema/限制 |
|---|---|
| `persona-driver.pack-progress.v1` | version 1；pack 与 reveal ID |
| `persona-driver.activation-history.v1` | 最多 50 条摘要，不含正文/token |
| `persona-driver.persona-cards.v1` | `persona-driver.persona-cards/v1`；自建/Soul 卡 |
| `persona-driver.custom-personas.v0` | 只读迁移源 |
| `persona-driver.persona-random-pool.v1` | version 1 shuffle-bag |
| `persona-driver.prompt-presets.v1` | 自定义 Prompt 管理记录 |
| `persona-driver.custom-materials.v1` | 自定义文档管理记录 |

## 7. 文件与资产读写

### 读取

- `public/**`：浏览器同源静态资产。
- Skill：`${PERSONA_NAVI_SKILLS_DIR}/{skill}/SKILL.md`。
- 固定原文：`${PERSONA_NAVI_MATERIAL_ROOT}/{MATERIAL_MANIFEST.fileName}`。
- Soul 成品：固定输出目录内必需文件与 `_knowledge/*.md`。

### 写入

- `.persona-runs/**`：Bridge 原子 JSON、输入快照与 NDJSON 生命周期日志。
- `${PERSONA_NAVI_SOUL_WORKSPACE_ROOT}/outputs/persona-souls/**`：create-soul 任务产物。
- localStorage：浏览器卡片、管理数据与进度。

不写 `brain/`、vault、固定原文、安装 Skill 或 YouNavi conversation 历史。调用 `/open` 也不会改变 conversation。

## 8. 公开运行时边界

公开 hostname 在 `startNaviConversation()` 中返回 `demo`，不调用 localhost Bridge；Cloudflare Worker 没有 Bridge 路由、D1 或 R2 主链。

但公开页面仍可在浏览器内编辑 custom Prompt/文档/卡片并写该浏览器 localStorage；相关内容不会发给本机 Bridge。`public/audio/local-test/` 与 `public/waiting-media/` 也仍位于静态树，运行门控不等于发布包排除。

## 9. 兼容与废弃

- v1 与 v2 同时支持；固定素材仍走 v1，文档走 v2。
- `normal` 不再接受；旧状态迁移为空并警告。
- `decision` 是当前 ID，`decide` 不接受。
- `PERSONA_NAVI_PRESET_ROOT` 只作 `MATERIAL_ROOT` 的后备别名。
- `persona-driver.custom-personas.v0` 只迁移读取。
- 旧 GLB/Three.js 不在浏览器运行接口；`app/driver-scene.tsx` 不是渲染组件。

## 10. 调用方不可依赖

- 不可依赖线上 Sites 版本等于当前工作树。
- 不可依赖 `finished` 自动成为 completed。
- 不可依赖本地 Soul Skill 文件存在就代表动态索引可执行。
- 不可依赖 `public/` 中标为 local-only 的文件不会被构建/部署。
- 不可依赖 `/open` 定位 conversation。
- 不可依赖 db/Drizzle/D1 starter 文件已接入 Persona 数据。
