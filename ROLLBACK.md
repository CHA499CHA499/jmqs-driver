# Persona Driver 回退手册

> 核对日期：2026-08-21。回退目标是停止新增副作用并恢复上一可用行为；不得删除真实 YouNavi conversation、Soul 产物或 `.persona-runs/` 审计证据。

## 根 Skill 入口回退

如果 YouNavi 无法识别或启动分发包：

1. 先确认导入目录根部存在 `SKILL.md`，其 `name` 为 `jmqs-driver`；不要回退为只分发 `.agents/skills/persona-driver-setup`。
2. 确认 `${SKILL_DIR}` 被替换为当前导入目录，并确认 `package.json`、`materials/` 与内部 setup 脚本仍在同一目录树。
3. 若自动 Skills 根推断错误，显式向 setup 脚本传 `--skills-dir <YouNavi Skills 根>`；不要搜索或猜测用户主目录。
4. 如需回退本轮实现，可还原根 `SKILL.md`、触发表和 `resolveSkillsDir()` 的同一次提交；保留 `.env.local` 与 `.persona-runs/` 作为本机恢复和审计证据。

## Persona Driver Setup Skill

若一键安装失败，先运行 `node .agents/skills/persona-driver-setup/scripts/setup.mjs doctor --project <path> --skills-dir <path>`。Skill 不覆盖名称冲突的现有 Skill；修复冲突目录后重跑即可。`.env.local` 可删除后由 Setup 重建，不影响内置材料或历史 Run。

若四份内置原文校验失败，从当前 Git 提交恢复 `materials/classic-interviews/` 与 `manifest.json`；不要跳过 SHA 校验或修改 manifest 伪装成功。

若报“内置人物 Skill 完整性校验失败”，从同一项目提交恢复 `.agents/skills/persona-driver-setup/assets/persona-skills/` 与 manifest；不要回退为运行 `git fetch`，也不要为绕过校验修改哈希。安装到目标 Skills 根之前若已存在同名但 frontmatter 不匹配的目录，保留现场并停止，禁止覆盖。

## 1. 回退前先保全

1. 停止产生新 Run：关闭页面或停止 Bridge/supervisor。
2. 记录故障时间、当前独立仓 commit/branch、浏览器 URL、Run ID、task ID、conversation ID、错误码。
3. 复制或只读保留对应 `.persona-runs/prun-*`、`.persona-runs/soul/psoul-*` 与 `bridge-events.ndjson`；不要改写 request/receipt。
4. 若 request 已存在但 receipt 缺失，先去 YouNavi 核对是否已创建 conversation；禁止自动重发或手工补 receipt。
5. Soul 故障时保留 `${PERSONA_NAVI_SOUL_WORKSPACE_ROOT}/outputs/persona-souls/*-soul`，不要随站点回退删除。

## 2. 最小隔离顺序

| 故障面 | 第一动作 | 不应连带回退 |
|---|---|---|
| 公开内容/版权/隐私 | 先停止或收紧 Sites 公开部署 | 不删除本机 Run/Soul 数据 |
| Bridge 重复创建/认证错误 | 停止 Bridge；web 可继续 demo | 不删除 YouNavi conversation |
| Soul 输入范围/产物错误 | 停止新增 Soul Run | 不删除既有卡库或产物 |
| 等待视频遮挡/卡死 | 关闭/卸载 WaitingVideoPanel | 不取消 Run |
| 结果阅读器错误 | 关闭结果窗；保留 Markdown/metadata | 不重建 conversation |
| 音频/人物 motion 错误 | 静音或关闭对应播放层 | 不阻断卡片/双棒/Run 主链 |
| Driver 拖拽/闭合错误 | 保留点击/键盘显式入口 | 不修改 Bridge、卡片数据或 Run |
| 管理中心错误 | 返回 workbench 或移除入口接线 | 不重置 workbench |

## 3. 运行时停机

### supervisor / Bridge

- 正常：在运行 `npm run dev` 的终端发送 SIGINT。
- 只停 Bridge：停止 `npm run navi:bridge`；页面随后应显示 `BRIDGE_OFFLINE`，公开 demo 不受影响。
- 8766 已被未知进程占用：先只读确认 PID/命令，再停止明确属于本项目的进程；不要启动第二个 Bridge。
- Bridge 异常重启：保留 `bridge-events.ndjson`，改为分别运行 `npm run dev:web` 与 `npm run navi:bridge` 定位。

supervisor 的 `BRIDGE_RESTART_LIMIT` 只是停止自动重启，不会回滚或删除 Run。

### 浏览器降级

- 真实 Bridge 不可用时不应伪造 activated success；保持错误码与重试。
- 必要时只运行 `npm run dev:web` 做 UI demo。
- 公开 hostname 必须保持 `demo` 分支，不能让 Worker 代理本机执行。

## 4. 数据回退

### localStorage 精确清理

| 目的 | 只清理此 key |
|---|---|
| 重走卡包 | `persona-driver.pack-progress.v1` |
| 清启动摘要 | `persona-driver.activation-history.v1` |
| 重置自建/Soul 卡 | `persona-driver.persona-cards.v1`；先导出或确认可丢失 |
| 重开随机池 | `persona-driver.persona-random-pool.v1` |
| 清自定义 Prompt | `persona-driver.prompt-presets.v1` |
| 清管理素材 | `persona-driver.custom-materials.v1` |

禁止整站 `localStorage.clear()`。页面“重新开始”只应删除 pack progress，不应删除启动历史或卡库。

### `.persona-runs/`

- 不作为普通缓存删除。
- request/receipt/result/continuation 是幂等与 RCA 证据。
- v2 `inputs/` 可能含用户正文；归档或销毁需用户明确同意并精确定位。
- 回退源码后仍保留旧 schema 的只读记录；不要批量重写历史 JSON。

## 5. 分层源码回退

在当前独立 Git 仓库中定位上一可用提交，创建新的 revert/回退提交；不要改写已共享历史。当前工作树有大量用户未提交变更，执行任何 Git 回退前必须先确认不会覆盖这些改动。

### Persona Driver 视觉/拖拽

成组检查/回退：

- `app/page.tsx`
- `app/driver-texture-scene.tsx`
- `app/driver-closure-layer.tsx` 与 CSS module
- `app/interaction-drag-layer.tsx`
- `app/globals.css`
- 对应 driver/layout/rendered tests

必须保留：`.driver-assembly` 唯一坐标源、base/middle/foreground 三层、页面级 DragLayer、显式启动按钮、点击/键盘回退。禁止恢复 Three.js、GLB 浏览器加载、人体底片、场景内第二套拖拽副本或 `--belt-nudge`。

### 卡片/管理中心

卡架故障优先只回退 `persona-card-shelf*`；详情只回退 `persona-detail-sheet*`；CRUD/随机池回退 `persona-card-model/editor*`；管理中心回退 `persona-management-*`。

安全门必须保留：固定卡只读、通用空位不可执行、自建/Soul 未映射卡不能创建 Run、上传图不被随机池覆盖、管理中心返回不重置 workbench。

### 双棒与 v1/v2

成组检查：

- `app/rod-content-model.ts`
- `app/rod-injector-panel.tsx`
- `app/page.tsx` 的 charged/equipped 与 request 构建
- `scripts/persona-navi-bridge-lib.mjs`
- rod/Bridge tests

不要只移除 UI 而保留激活门槛。固定素材应继续走 v1，单个文档走 v2；每 Run 恰好一篇、文档 ≤1 MiB、custom Prompt ≤4,000 字符。不得恢复 `normal` 或把文档正文塞进 CLI prompt。

### Persona Bridge / EOF / continuation

紧急停用先停 Bridge。源码回退必须成组覆盖 HTTP 路由、Bridge lib、共享 Run contract、页面轮询和测试。

必须保留：

- loopback Host/Origin/Fetch Metadata/token 四门。
- `execFile` 参数数组，不走 shell。
- 服务端 Persona/Command/Material manifest。
- request-before-send 与 receipt 幂等保护。
- 期望 Skill 结构化证据门。
- EOF coverage 门；`SOURCE_NOT_FULLY_READ` 不展示结果。
- continuation 复用 conversation 和 stalled 防循环。

若 continuation 本身故障，可以暂时移除调用入口，但保留 incomplete 状态和“新建 Run”恢复路径；不要猜测 EOF 或从 0 静默重读。

### Soul

可先从管理中心移除 `SoulCardWizard` 注入，保留手工创建卡。源码回退成组覆盖：

- `app/soul-card-model.ts`
- `app/soul-card-runtime.ts`
- `app/soul-card-wizard.tsx`
- `scripts/persona-soul-bridge-lib.mjs`
- `/soul-runs` 路由与测试

不得放宽精确路径、隐私确认、speaker purification、固定输出目录、必需文件/知识/引语/来源门。动态 Skill 索引未确认时必须继续 `unmapped`。

### 等待视频

调用方停止渲染 `WaitingVideoPanel` 即可，不取消 Run。若 480p 文件有问题，从项目外归档恢复 720p 备份后再显式修改路径；独立仓不默认携带该备份。播放器仍只允许 localhost + accepted receipt + pending/running。

文件位于 `public/`，若问题是公开部署携带大媒体，正确回退是发布资产排除/移出 public，而不是只隐藏组件。

### 结果阅读器

关闭/撤下 `RunResultSheet` 不影响 Run。保留 `contentMarkdown` 与 metadata；不得为修 UI 重建 conversation。

结果门必须继续要求 completed + Markdown + complete coverage。Markdown 继续结构化渲染，禁止改为不受控 HTML。`/open` 只是打开 YouNavi App，不应改文案为 conversation 深链。

### 音频与 motion

音频故障可单独回退 `audio-library.ts`/`driver-audio.ts` 并使用 Web Audio/TTS/静默降级；播放异常不得抛回业务流程。不要引入无授权影视原声。

开包 motion 可按人物关闭或降级静态卡面；Naval/Musk 与另外三人的目录映射不可整组替换。Driver 激活 motion 当前本来就是 `false`，不要把关闭误判为回退失败。

## 6. 发布回退

1. 在 Sites 版本列表选择上一条已验证版本。
2. 重新部署为生产版本，不删除历史版本。
3. 回读根页面、标题、卡包、静态资产与公开 demo 分支。
4. 确认公开页面没有调用 localhost Bridge。
5. 审计部署产物是否仍携带 `public/audio/local-test/`、`public/waiting-media/`、GLB/QA；当前源码尚未实现物理排除。

`.openai/hosting.json` 含既有 project ID。私有 Git remote 已按用户授权创建，但这不授权部署 Sites、修改公开可见性或重绑定 project ID；这些动作仍需单独确认。

## 7. 独立仓回退与首次发布

- 当前目录已有独立 `.git`；`origin` 为私有 `https://github.com/CHA499CHA499/jmqs-driver.git`，默认分支 `main`。
- 不要用外层 CHA499 的 reset/clean 处理这个嵌套仓。
- 首发前先处理 dirty/untracked 主链；不可用 `git clean` 清理，因为大量新源码和资产尚未提交。
- 生成物 `node_modules/.next/.vinext/dist/.wrangler/.persona-runs/.env*` 保持排除；还应排除 `tsconfig.tsbuildinfo`。
- 本机绝对路径通过环境变量显式提供；不要把 transcripts、安装 Skills、Soul outputs 或 `.persona-runs` 复制进独立仓。
- 首次 private remote/push 已获授权；后续 tag、公开化、强推、历史重写或部署仍需要用户另行明确授权。

## 8. 回退后验证

最低自动化：

```bash
npm run build
npm test
npm run lint
```

再按影响面验证：

- 视觉：1440px + 390px、5/7/12 卡、拖拽与键盘。
- Bridge：可绑定端口环境下 Origin/Host/token 测试。
- Persona：v1、v2、EOF continuation、结果门。
- Soul：失败不写卡、完整产物投影、索引未确认保持 unmapped。
- 媒体：等待窗关闭不取消 Run，音频失败不阻断主流程。

自动化通过仍不能替代真实浏览器与真实 YouNavi 回归。
