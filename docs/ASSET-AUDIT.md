# Persona Driver 资产纯净审计

审计日期：2026-08-21
审计范围：仅 `axon/bridge-persona-atlas-site`
审计基线：独立仓库 `main`，HEAD `c2db321`（`补齐 Driver 模型与本机预设合同`）
审计性质：只读盘点；本文件不授权删除、移动或改写任何现有文件。

## 执行记录

- 2026-08-27：五个人物 Skill 以已固定的精确 Git tree 随 setup 内置，排除 `.git`；共 54 个文件、9,345,167 bytes。新增 manifest 固定公开来源、commit、tree 与聚合 SHA-256，分类为 KEEP；首次安装不再从 GitHub 下载。
- 2026-08-21：批次 A 已执行。7 张顶层 masked-v2 重复图、1 张重复 contact sheet、被否决卡背和 3 个 starter SVG 已移出项目，归档到 `CHA499/artifacts/persona-driver-convergence/2026-08-21/batch-A/`；逐文件 SHA-256 见同目录 `MANIFEST.md`。随机池正本保留，卡片/HTML/Soul 定向测试 21/21 通过。
- 2026-08-21：`tsconfig.tsbuildinfo` 已移出项目并加入 `.gitignore`。因本地 3000 开发服务仍在运行，`dist/.vinext/.wrangler/.next` 暂未清理。
- 2026-08-21：用户确认“未使用清除、历史迁到项目外”。历史 GLB/材质、frames、QA、旧立绘/motion、男女模板媒体、720p 等待视频和旧 presets 演示稿已移入 `CHA499/artifacts/persona-driver-convergence/2026-08-21/history/`；自动测试改为只验证运行时资产，不再要求历史证据位于 `public/`。
- 2026-08-21：未接入主链的 `db/`、`drizzle/`、`examples/d1/` 与配置已移入 `unused-scaffold/` 归档；Drizzle 依赖、脚本和 Worker D1 类型同步移除。
- 2026-08-21：用户确认 480p 等待视频与 `public/audio/local-test/` 是项目使用资产，必须随独立项目保留，避免其他使用者功能缺失；两组从 `NEEDS_CONFIRMATION` 转为 `KEEP`。720p 备份继续留在项目外归档。

## 结论

当前资产不能按“没有源码引用”一刀切删除。扫描得到四类结论：

- **KEEP**：当前页面、测试或构建入口直接依赖，删除会立即破坏功能、合同或发布元数据。
- **DELETE_CANDIDATE**：有字节级重复、明确被否决、明确被替代或是可重建缓存；仍须按本文批次执行并验收。
- **ARCHIVE_CANDIDATE**：不在网页运行链路，但承担源资产、回滚、视觉证据或历史对照职责；应先移出公开发布面并建立可校验归档，不能直接销毁。
- **NEEDS_CONFIRMATION**：代码、文档、测试、发布边界或产品方向互相冲突；需要先确认目标状态。

最重要的发布风险不是单个旧人物图，而是两个“本地资源放在 `public/`”的集合：

1. `public/waiting-media/` 共 **350,783,649 bytes / 334.53 MiB**。代码只播放 480p，但构建仍把 480p 与 720p 都复制到 `dist/client/waiting-media/`。README 明示来源为 Bilibili、仅供本地测试、禁止公开部署。
2. `public/audio/local-test/` 共 **17,256,387 bytes / 16.46 MiB**。运行时会按 localhost / 环境变量门控播放，但构建仍会公开复制这些本地测试音频。

因此，“不播放”不等于“不发布”。正式发布前必须把这两组资源改成明确的本地挂载、构建排除或版权已清资源；当前不能直接删，因为本地运行和测试仍依赖它们。

## 审计方法与判定边界

### 使用的方法

- `rg --files`：盘点忽略规则之外的 355 个文件。
- `rg -n/-l -F`：扫描 `app/`、`tests/`、`scripts/`、README、INTERFACE、CHANGELOG、ROLLBACK、构建配置和 manifest 中的路径/文件名引用；排除 `.git/`、`node_modules/`、`dist/`、`.next/`、`.vinext/`、`.wrangler/`、`.persona-runs/` 和 `tsconfig.tsbuildinfo` 的噪声。
- `stat -f '%z'`：记录逻辑字节数；MiB 按 `bytes / 1048576`。
- `shasum -a 256`：识别字节级重复，并为关键文件或目录建立 SHA-256。
- 目录指纹算法：对目录内每个文件执行 SHA-256，按完整输出行排序，再对排序结果执行一次 SHA-256。该指纹用于审计快照，不等同于 Git tree hash。
- `ffprobe`：实测两个等待视频的编码、分辨率、帧率、时长与大小。
- `git status` / `git ls-files`：区分 HEAD 已跟踪资产和当前未提交资产。

### 不自动判删的规则

- 无源码引用不等于可删：文件可能是 manifest 动态加载、测试 fixture、QA 证据、离线源资产或回滚备份。
- 测试/文档引用也不自动等于 KEEP：若文件只承担归档证据，应从 `public/` 迁到不发布的归档面，而不是永久占用发布包。
- 文件名相同或视觉相似不等于重复；只有 SHA-256 相同才按字节级重复处理。
- 当前独立仓库工作区已有大量未提交/未跟踪资产。未跟踪文件不能靠 `git revert` 恢复，未来清理前必须先做外部归档或纳入可恢复提交。

## 总盘点

| 范围 | 文件数 | 体积 | 主分类 | 结论摘要 |
|---|---:|---:|---|---|
| `public/personas` | 34 | 12,391,198 B / 11.82 MiB | 混合 | 当前 action 立绘与随机池 KEEP；旧立绘、模板和顶层重复副本拆分处理 |
| `public/personas-motion` | 10 | 16,986,884 B / 16.20 MiB | 混合 | Naval、Elon 的视频/海报 KEEP；其余三人的旧视频/海报归档 |
| `public/personas-motion-v3-intense` | 7 | 29,717,760 B / 28.34 MiB | 混合 | Jobs、Trump、PG KEEP；Naval、Elon 明确禁用；男女模板 motion 无运行引用 |
| `public/driver-textures` | 143 | 53,993,795 B / 51.49 MiB | 混合 | 运行图层 KEEP；frames、QA、canonical/alias 分开处理 |
| `public/models` | 6 | 3,487,295 B / 3.33 MiB | ARCHIVE_CANDIDATE | GLB/材质不进浏览器，但被测试和回滚合同保留 |
| `public/waiting-media` | 4 | 350,783,649 B / 334.53 MiB | 混合 | 480p 本地运行依赖；720p 只作回退；两者都不应随公开构建发布 |
| `public/audio` | 28 | 17,374,565 B / 16.57 MiB | 混合 | 公开播报 KEEP；`local-test` 需要发布边界确认 |
| `public/brand/qa` | 2 | 370,070 B / 0.35 MiB | ARCHIVE_CANDIDATE | Logo 选择/预览证据，无运行引用 |
| `public/cards/qa` | 3 | 5,479,023 B / 5.23 MiB | 混合 | 2 张验收图归档；1 张被否决卡背可删候选 |
| `persona-card-qa` | 5 | 215,664 B / 0.21 MiB | ARCHIVE_CANDIDATE | 卡架/结果页验收；一张被 CHANGELOG 点名 |
| `persona-management-qa` | 9 | 360,338 B / 0.34 MiB | ARCHIVE_CANDIDATE | 管理页验收，无代码引用但仍有视觉回归价值 |
| `examples/d1` | 2 | 2,070 B | DELETE_CANDIDATE | Site starter 示例，无产品路由引用 |
| `drizzle` | 1 | 61 B | NEEDS_CONFIRMATION | 空 journal，但 `db:generate` 和配置仍存在 |
| `db` | 2 | 592 B | NEEDS_CONFIRMATION | schema 为空，应用未 import；仍与 Drizzle 配置成套 |
| `worker` | 1 | 1,731 B | KEEP | `vite.config.ts` 的 Cloudflare Worker 主入口 |

另有构建/工具产物：`dist` 497,802,653 B、`node_modules` 419,938,387 B、`.next` 990 B、`.vinext` 194 B、`.wrangler` 45,858 B、`tsconfig.tsbuildinfo` 224,758 B。这些不是产品源资产，可作为工作区清理候选；`.persona-runs` 95 文件 / 198,616 B 是运行记录，未建立保留策略前不得混入缓存清理。

## KEEP

### 当前人物立绘与随机池

- 五张基线 `public/personas/{naval,elon-musk,steve-jobs,donald-trump,paul-graham}-action-masked-v3.jpg`：**5 文件，1,988,399 B**；目录集合指纹 `b24939113a168004922cae0f32d9b3ffd1f2e7fe81065b68bb64a3a6c4f7d52a`。
  - 证据：`app/page.tsx` 的五个 `PERSONAS[].image` 直接引用；`tests/rendered-html.test.mjs` 逐文件读取并检查大小。
  - 替代资源：没有等价运行替代；旧 `*.jpg` 构图与当前 action 版不等价。
  - 删除风险：卡包、卡架和 Driver 人物层失图，结构测试失败。
- `public/personas/random-pool/masked-bust-v2/` 的 7 张人物图与 `manifest.json`：**8 文件，2,293,718 B**。
  - 证据：`app/persona-card-model.ts` 读取固定 manifest URL，manifest 动态列出全部 7 张图；README 明确用于 custom/Soul 无上传图时的 shuffle-bag。
  - 注意：单张图片不会在源码中逐个出现，不能据此删除。
  - 同目录 `contact-sheet.jpg` 不参与 manifest，归入 ARCHIVE_CANDIDATE。

### 当前 motion

- KEEP 集合：
  - `public/personas-motion/naval.{mp4,jpg}`
  - `public/personas-motion/elon-musk.{mp4,jpg}`
  - `public/personas-motion-v3-intense/{steve-jobs,donald-trump,paul-graham}-action-masked-intense-v3.mp4`
- 共 **7 文件，18,942,270 B**；集合指纹 `7a4197895fe38ec7634150f4f93c4d76081276214dbcbc135227d950b274f615`。
- 证据：`app/page.tsx` 直接映射；`tests/pack-motion-state.test.mjs` 锁定五条批准视频路径，并明确禁止 Naval/Elon 接 intense 版本；INTERFACE 也记录同一合同。
- 删除风险：卡包入场视频或海报缺失，motion 合同测试失败。
- 发布前仍需确认这些 motion 的生成/授权来源；当前静态人物 README 只记录了静态图的 ImageGen 来源，没有覆盖 motion。

### Driver 运行图层

KEEP 的 13 个文件共 **14,106,065 B**，集合指纹 `8b3717694da7f0cad50ae2692b71d8186b7eeeab8e194683284198eb000cf742`：

- `belt-v1.png`
- `assembly/{center-core-v2,left-chassis-v2,right-chassis-v2,foreground-masks-v2,left-slot-foreground-v2,right-slot-foreground-v2}.png`
- `assembly/manifest.json`
- `energy-rod-empty-v1.png`
- `energy-rod-charged-v1.png`
- `energy-rod-charged-tight-v1.png`
- `skill-rod-v1.png`
- `skill-rod-charged-tight-v1.png`

证据来自 `app/page.tsx`、`app/driver-texture-scene.tsx`、`app/driver-closure-layer.tsx` 和 `app/persona-management-page.tsx` 的直接路径，以及 `tests/driver-closure.test.mjs` 的画布、alpha bbox、装配层和状态验收。删除任何一项都可能造成 Driver 缺层、棒槽错位或测试失败。

### 音频、品牌与页面元数据

- `public/audio/persona-driver-announcer-v2-expressive.m4a`：118,178 B，SHA-256 `176cef5e514ee488ff8db0de67a0c0bae44f1430153469d2f5ca2dc2dfdaeb44`（INTERFACE 已记录同值）。`app/driver-audio.ts` 和测试直接依赖。
- `public/brand/persona-gate-logo-v1-{32,64,256}.png`：页面、卡面和结构测试分别引用。删除风险为品牌图缺失。
- `public/hero-personas.png`、`public/og.png`、`public/favicon.svg`：分别由 `globals.css`、`layout.tsx` 的 OpenGraph/Twitter metadata 和 icon metadata 引用。
- `worker/index.ts`：`vite.config.ts` 的 `localBindingConfig.main` 直接指向该文件；它不是可删的 starter 残留。

## DELETE_CANDIDATE

以下是候选，不是本次已执行删除。

### 字节级重复的顶层 masked-v2

`public/personas/` 顶层 7 张 `*-masked-v2.jpg` 与 `public/personas/random-pool/masked-bust-v2/` 内同名文件逐字节相同；manifest 只指向 random-pool 副本。顶层副本合计 **2,291,641 B**，可保留 random-pool 正本后删除顶层副本。

| 文件名 | SHA-256（两份相同） |
|---|---|
| `naval-masked-v2.jpg` | `8c9fa96f3651658bc6d6abb33034bf323b182691b81d7da76138c53d3a14f34a` |
| `elon-musk-masked-v2.jpg` | `3d5f151eb8ca7306997537dd95329f42c6b3bca75bdd713c26d99bed3a417b64` |
| `steve-jobs-masked-v2.jpg` | `570e5ef690a3cb4ace4bcf49a758d668545a5c0e53e1be999db20af6c87a7d8` |
| `donald-trump-masked-v2.jpg` | `1b6be6ebdef3b329cb0fe3bcb1e86bba1b29c20699950e268f08e3e3bb4f8cec` |
| `paul-graham-masked-v2.jpg` | `55cc6b961773ce6d6be81f6a8cb882b1971c51b371a63cfd0ec9d1be6687b614` |
| `custom-template-male-masked-v2.jpg` | `9149391c07e48108635461d7452ca5496af17dfff9576b80024ff95a889df66e` |
| `custom-template-female-masked-v2.jpg` | `8d35b1ee1932545c0a9dddd273ab19bd5ac43163630f7c44167c0040f2ede677` |

`public/personas/qa/masked-v2-contact-sheet.jpg` 还与 random-pool 内 `contact-sheet.jpg` 相同（384,164 B，SHA-256 `1190ca271be59427f5754a8ae87c0c8a4661e145cef115301745112bab886e40`）。建议保留靠近随机池正本的 contact sheet，删除 QA 目录内重复副本。

### 被否决卡背

- `public/cards/qa/rejected/persona-card-back-base-v1.png`：**2,700,129 B**，SHA-256 `8df5fde66f20d98d954f22355c61a2bc3ea6830a2696d846e162d92c93624964`。
- 证据：目录已标记 `rejected`；`ROLLBACK.md` 明确“不得把它加回 sealed pack”；`tests/persona-card-components.test.mjs` 明确禁止卡背组件引用 `persona-card-back-base`。
- 替代资源：`app/persona-card-back.tsx` + CSS 的现行极简卡背，以及 `public/brand/persona-gate-logo-v1-256.png` 的 sealed pack 品牌图。
- 删除风险：运行风险低；会失去被否决方案原图。若设计复盘仍需原图，应先放入不发布的设计归档，而不是留在 `public/`。

### 明确的 starter 静态图

- `public/file.svg`：392 B，SHA-256 `1e0ae4d1a1ddfa36752988647b731e4abf150c414d069ec83c96fb0aaeff0307`
- `public/globe.svg`：1,036 B，SHA-256 `d051a8c47936990a9085693d307bb7cea1bc1b6d7ed956bcbaacf674f4ec96b9`
- `public/window.svg`：386 B，SHA-256 `decf1cf7bb22b5c99c4857cfcd5718ce5465c4454166317589c83fc73df74b66`

三者无代码、测试或文档引用，且是典型 starter 默认图标。替代资源为现行品牌 Logo / favicon；删除风险低。

### 旧男女模板与禁用 intense 版本

- `custom-template-{male,female}-v1.jpg`：2 文件，**1,144,045 B**。代码只保留 legacy ID 迁移，当前 UI 使用唯一 `custom-template-empty-v1`，没有旧图片路径。
  - female SHA-256 `d84f112b067b46ff1d85e73e6d0fe2752071ee6bd7d0ef5df9d61601a0f53eee`
  - male SHA-256 `b410f4edce0df5cec7de58e3a13ce554f21f99aacef2c36be494760910e82dd2`
  - 替代资源：通用空位模板 + random-pool；风险是未来若要恢复性别模板会缺少旧视觉。
- `personas-motion-v3-intense/{naval,elon-musk}-action-masked-intense-v3.mp4`：2 文件，**9,069,431 B**。
  - Naval SHA-256 `0d0a508e18c85dcc6fcf87524e8ad5458e28bacba569ac229fc02c468703cdf5`
  - Elon SHA-256 `ce3b461e48f4f3453dd307caf2cdfb61a20adf9de7bfc92cd6318a8cac315fe9`
  - 证据：零运行引用，且 `tests/pack-motion-state.test.mjs` / INTERFACE 明确禁止 Naval、Elon 误接 intense。
  - 替代资源：已批准的 `personas-motion/naval.mp4`、`elon-musk.mp4`。

这两组虽是删除候选，但不是第一批无条件删除项：它们当前未被 Git 跟踪，且模板/视觉来源没有独立归档，需先确认不会恢复旧模板或重新挑选 motion。

### D1 示例

- `examples/d1/`：2 文件，2,070 B，目录指纹 `5c18ab6664146b3007b452416464c6c41432499d8599c12529401feac60ee44a`。
- 证据：没有产品路由 import；`db/schema.ts` 只在注释中指向它。它是 opt-in notes 示例。
- 删除风险：产品若计划接 D1，会失去现成示例；应与 `db`/Drizzle 去留一并确认。

### 可重建工作区产物

- `dist/`、`.next/`、`.vinext/`、`.wrangler/`、`tsconfig.tsbuildinfo`：构建/工具产物，可重建。
- `node_modules/`：可由锁文件重装。
- 不得把 `.persona-runs/` 混入本批；它是运行记录，不是编译缓存。

## ARCHIVE_CANDIDATE

### 旧人物图与旧 motion

- `public/personas/{naval,elon-musk,steve-jobs,donald-trump,paul-graham}.jpg`：5 文件，**1,485,711 B**。
  - 当前 `PERSONAS[].image` 已全部指向 action-masked-v3；测试中的 `/personas/naval.jpg` 只是路径校验样例，不读取该文件。
  - README/INTERFACE 仍笼统写“五张人物立绘”，且这些文件已被 Git 跟踪，适合作为历史基线归档，而非直接销毁。
- `public/personas-motion/{steve-jobs,donald-trump,paul-graham}.{mp4,jpg}`：6 文件，**9,624,722 B**。
  - 当前三人均由 intense-v3 视频替代；旧海报也没有 `motionPoster` 引用。
  - README 明确把整个 v1 motion 目录视为素材归档，ROLLBACK 也要求保留原始素材，因此应移出公开发布面并保留校验归档。

### 男女模板 action / motion

- `public/personas/custom-template-{male,female}-action-masked-v3.jpg`：2 文件，1,080,273 B。
- `public/personas-motion-v3-intense/custom-template-{male,female}-action-masked-intense-v3.mp4`：2 文件，9,068,221 B。
- 代码现为唯一通用空位模板，以上四项没有运行引用；但 INTERFACE/ROLLBACK 仍声称“两张模板 action 资产”属于合同，说明文档与实现尚未收口。
- 处理建议：先归档，再由产品确认是恢复男女模板、改文档为通用模板，还是正式删除。当前不应直接删。

### GLB 与模型材质

- `public/models/persona-driver/` 除 README 外 5 文件，**3,486,469 B**；目录总指纹（含 README）`ea2f72a5067aea6b1ef5529ef5b67e64687260efc0844961bd813ed17bcd9a6d`。
- 单文件 SHA-256：
  - `belt.glb` `cef9cd285b62ece6bc8d3efa1abe50a24bed17405b2f65178e55bb4cd2d9f280`
  - `persona-card.glb` `f390e4851a090d3079b9c3b8c46f564d0e539f170e0f615c700fcd24b73de48b`
  - `energy-rod.glb` `bd77e48097fe7546eae4bcf49a758d668545a5c0e53e1be999db20af6c87a7d8`
  - `skill-rod.glb` `2065fa44596fd0acbe52bfc6c41dbfac29e552d1c4330ed91523a84d1e129c15`
  - `textures/brushed-gunmetal-v1.png` `819b79b80fb414337339ac3ebbbd9d73cb39572d6d037ae02991aa74b4b08451`
- 证据：浏览器不加载 GLB，README/INTERFACE 明确为历史离线源；但 `tests/rendered-html.test.mjs` 逐文件读取并把它们定义为“offline sprite sources”。
- 替代资源：当前网页的二维 `driver-textures`；它不是可逆的三维源替代。
- 删除风险：网页短期不坏，但失去三维源和测试合同。建议迁至不发布的 source archive，更新测试和四份 axon 文档后再从 `public/` 移除。

### 离线 frames

- `public/driver-textures/frames/`：24 文件，**9,965,350 B**，目录指纹 `b6f62ae85eda3809817f53d121a548fc8fd502e9893c3c2eaced8b147da2d865`。
- 证据：没有 app 运行引用；`scripts/compose-persona-driver-texture-sprites.py` 是唯一生成入口，INTERFACE 明确“网页默认直接显示元素图，不加载模型渲染帧”。
- 替代/恢复：保留批准元素图和生成脚本后可重生成；但当前 frames 未被 Git 跟踪，且未实际执行重生成一致性验收，所以不能直接当作可丢缓存。
- 建议：先归档现有 frames + 指纹；在临时副本中重生成并逐文件比对哈希，确认确定性后才升级为 DELETE_CANDIDATE。

### QA 截图与验收证据

| 目录 | 文件/体积 | 目录指纹 | 证据与风险 |
|---|---:|---|---|
| `public/driver-textures/qa` | 95 / 23,521,313 B | `4f25d802b315752fdc7ed95c36a0a5c543d3a03514b54609e0b10883dba8f603` | INTERFACE 与 `driver-closure.test.mjs` 直接引用一部分 metrics/contact sheet/state 图；其余仍是几何、时间线和 UI 修复证据 |
| `public/personas/qa` | 3 / 1,721,929 B | `eb3f06cd8f834a731c911f47c9ae216f3606ec03ae3c4ea45c5741954fe8c1ec` | 人物版本 contact sheet；其中 masked-v2 sheet 有同哈希副本 |
| `public/brand/qa` | 2 / 370,070 B | `3bb5cc193cd16cca1123157e0f1c50d1fb0237c39188fd565100cd1c4754e3a5` | Logo 候选与卡面预览，无运行引用 |
| `public/cards/qa` | 3 / 5,479,023 B | `25e5e84b5973115112282dec0e168103bfa23844158b701fd21b1f818e35d597` | 两张现行卡背验收图应归档；rejected 原图另列删除候选 |
| `persona-card-qa` | 5 / 215,664 B | `d1fff984e68e6f7a26617912cf91cc13222fef9cfaa6432b0bfc1ddcc7140030` | `run-result-ia-1440.png` 被 CHANGELOG 点名，其余为卡架/结果页视觉证据 |
| `persona-management-qa` | 9 / 360,338 B | `4cdf01f99108b567d8186f2c9599a82ae428d4c3be26844c5a9b4cf21da5b391` | 无源码引用，但覆盖管理页、窄屏、pending 和主题参考 |

这些截图不应继续留在可公开发布的 `public/`，但也不应无归档销毁。优先迁至 release/QA artifact 或不发布的 `docs/qa-archive`，并把测试从“发布目录存在性”改成“独立 QA artifact 完整性”。时间线中多张图片 SHA 相同并不表示多余：相同画面可能证明不同采样时刻处于稳定状态，路径本身包含时序语义。

### 其他源图

- `public/brand/persona-gate-logo-v1.png`：1,187,222 B，无运行引用；32/64/256 尺寸版是现行替代。建议作为高分辨率品牌母版归档，不直接删除。
- `public/waiting-media/decade-all-riders-waiting-v1.mp4`：235,787,773 B / 224.86 MiB，SHA-256 `1e1c999c8669a7217856b1cf124d2baec2af79cece7fab85a8c95253e0f0cd77`。实测 1280×720、30fps、H.264、996.623 秒。代码不播放，但测试、INTERFACE、ROLLBACK 把它定义为 480p 回退备份。应放入私有/本地归档，不应留在公开 `public/`。

## NEEDS_CONFIRMATION

### 480p 等待视频的发布边界

- 文件：`public/waiting-media/decade-all-riders-waiting-v1-480p.mp4`
- 大小/哈希：114,994,656 B / 109.67 MiB；SHA-256 `a2786b68523cbff74ad1c6bd12c997794bc2cfabfe1186da19ca3f2f2bb976f1`
- 实测：854×480、30fps、H.264、996.623 秒。
- 引用：`app/waiting-video-panel.tsx` 的 `WAITING_VIDEO_SRC`、字幕 `<track>`、`tests/waiting-video-panel.test.mjs`、README/INTERFACE。
- 替代资源：没有现成的版权已清同功能视频；720p 不是发布替代，只是更大的同源备份。
- 风险：删除会破坏本地等待面板；保留在 `public/` 会被构建复制，和“禁止公开部署”冲突。
- 所需确认：Persona Driver 最终是仅本地运行，还是需要公开部署。公开部署时应使用版权已清短片或从 `public/` 改为不会进入构建的本地资源挂载。

### local-test 音频

- `public/audio/local-test/`：27 文件，17,256,387 B。
- 16 个 candidate 和 9 个 announcer 由代码种子 + `manifest.json` 动态引用；`decade-source-p1-heisei.m4a` 还被代码声明为 source resource，并被测试检查存在。
- `getDriverAudioBundleMode()` 在 localhost 选择 local-test，在公开域名选择 public-cleared；但静态文件仍进入构建。
- 删除风险：本地音效与测试失败；保留风险：未清权本地素材进入公开包。
- 所需确认：发布流程是否能排除 `public/audio/local-test`。不能排除时，应迁到忽略目录/本地静态服务，并让测试从该位置读取。

### Driver 同哈希 alias 与 canonical QA 图

以下文件是准确重复，但当前被生成脚本、测试或文档锁定，不能只凭哈希删除：

| SHA-256 | 重复路径 | 当前约束 |
|---|---|---|
| `1aa45b3ae4360f1cd28ddce850fd021d55f087f1d66d721717c4010cd3d95c4d` | `belt-foreground-v1.png` = `assembly/foreground-masks-v2.png` | 前者是离线脚本输入，后者是运行图层 |
| `7b909791f43e1fea66ed198690ad686d587d6f851603bbf4f4f4d5921fd72613` | `energy-rod-v1.png` = `energy-rod-charged-v1.png` | 前者是脚本/README 名称，后者是运行路径 |
| `d097f05c3b1252f56650c3163c8968a86b779be83f4522439901d5635de328e6` | `energy-rod-canonical-v1.png` = `energy-rod-charged-canonical-v1.png` | `driver-closure.test.mjs` 同时要求 |
| `37489d0b20914811810ec3538e8c832f49c71cc770227ddbb90d7defc98cbba1` | `skill-rod-canonical-v1.png` = `skill-rod-charged-canonical-v1.png` | `driver-closure.test.mjs` 同时要求 |
| `95b1553a7ed84a72edb92672b864849381fdd6e94dab081268c68e37117c1d72` | `energy-rod-tight-v1.png` = `energy-rod-charged-tight-v1.png` | 前者测试合同，后者运行路径 |
| `c375d40826e546d386cfc0515f550e7447e6bbd9cff180439caf0f6da112db2e` | `skill-rod-tight-v1.png` = `skill-rod-charged-tight-v1.png` | 前者测试合同，后者运行路径 |

处理建议：若要去重，应先统一 canonical 命名，改脚本、测试、README、INTERFACE、ROLLBACK，再删 alias。当前归类为 NEEDS_CONFIRMATION，而不是安全删除批次。

### Drizzle / DB 与 starter 元数据

- `db/schema.ts` 明确为空；`db/index.ts` 没有被 app import；`.openai/hosting.json` 的 `d1` 为 `null`。
- 但 `drizzle.config.ts` 指向 `db/schema.ts`，`package.json` 保留 `db:generate`、`drizzle-kit`、`drizzle-orm`，`vite.config.ts` 也保留可选 D1 binding。
- `package.json.name` 仍是 `site-creator-vinext-starter`，`worker/index.ts` 注释也保留 starter 文案；其中 Worker 本体实际被构建使用，不能整组删除。
- 所需确认：产品是否明确不使用 D1。若确认不用，应该作为一次代码/依赖/文档收口批次移除 `examples/d1`、`db`、`drizzle`、`drizzle.config.ts`、依赖和脚本；只删目录会留下悬空配置。

## 关键哈希重复扫描补充

除上文可删重复和 Driver alias 外，扫描还发现 QA 序列中的同哈希文件：

- `driver-mid.png` = `driver-snap.png`。
- `browser-geometry/1440-insertion-{0,50,100}.png` 三张相同。
- `single-energy/energy-{400,620,900}ms.png` 三张相同；tight 目录同样三张相同。
- `double-activated/activated-{80,160,300,500,800}ms.png` 五张相同。
- `activated-click-{0,80}ms.png` 两张相同；`activated-click-{300,500,800}ms.png` 三张相同。

这些文件名编码采样时刻，重复像素可证明动画到达稳定态，不建议按字节重复直接删。若 QA 系统支持内容寻址，可将一个 blob 与多个采样记录分离，以减少物理存储但保留证据语义。

## 安全删除批次建议

### 批次 0：可重建工作区缓存（不属于产品资产）

候选：`dist/`、`.next/`、`.vinext/`、`.wrangler/`、`tsconfig.tsbuildinfo`；需要时再清 `node_modules/`。
前置：确认没有正在运行的预览/部署读取这些目录。
回滚：重新安装锁定依赖并执行构建。
禁止包含：`.persona-runs/`、`.git/`。

### 批次 A：低风险、零运行引用、已有明确正本/替代

候选：

1. 顶层 7 张 `public/personas/*-masked-v2.jpg`，保留 random-pool 内同哈希正本。
2. `public/personas/qa/masked-v2-contact-sheet.jpg`，保留 random-pool 内同哈希正本。
3. 被否决的 `public/cards/qa/rejected/persona-card-back-base-v1.png`；若仍需设计复盘，先归档。
4. `public/{file,globe,window}.svg` starter 图标。

合计候选 **5,377,748 B / 5.13 MiB**；若把 `tsconfig.tsbuildinfo` 一并作为缓存清理，总计 **5,602,506 B / 5.34 MiB**。

验收：

- 用 `rg` 确认没有新增路径引用。
- 重跑 SHA-256，确认保留副本与删除副本仍完全相同。
- 构建后确认人物随机池、卡背、favicon/品牌资源正常。
- 运行与人物卡、卡背、HTML、Soul 随机池相关的测试。

### 批次 B：产品确认后删除

候选：旧男女 `custom-template-*-v1.jpg`、禁用的 Naval/Elon intense 视频、`examples/d1/`。
合计 **10,215,546 B / 9.74 MiB**。
前置：确认不恢复性别模板、不重新选择 Naval/Elon intense、且无 D1 示例保留需求；先给未跟踪媒体建立归档。
验收：motion 映射测试、模板迁移测试、全量构建和 D1 配置扫描。

### 批次 C：先归档、再从公开发布面移除

候选：720p 等待视频、旧五人原始静态图、三人旧 motion/海报、GLB/材质、frames、QA 截图、高分辨率 Logo 母版、男女模板 action/motion。
这不是“直接删除”批次。必须先建立不随站点发布的归档、写入逐文件 SHA-256 manifest，并调整测试/README/INTERFACE/ROLLBACK/CHANGELOG 后，才能从 `public/` 或仓根 QA 目录移除。

### 批次 D：发布边界改造

候选：480p 等待视频与 `public/audio/local-test/`。
先提供版权已清替代或本地资源挂载，再修改代码与测试，最后从公开构建输入移除。没有替代前不执行删除。

## 回滚方案

1. **建立可恢复基线**：未来任何清理前，先保存 `git status --short`、HEAD、逐文件 `stat` 与 SHA-256 manifest。当前大量候选是未跟踪文件，单靠 Git tag/branch 不足以恢复。
2. **归档未跟踪资产**：对将清理的未跟踪文件制作只读归档，归档名包含日期、批次和 HEAD，例如 `persona-driver-assets-2026-08-21-batch-A-c2db321`；归档应存放在本项目发布目录之外。
3. **一批一提交**：缓存清理、重复项删除、历史资产归档、发布边界改造分开提交。涉及 axon 工具资产/路径变化时，同步 README、CHANGELOG、INTERFACE、ROLLBACK；发布路径或依赖变化再同步仓根 MIGRATION/ARCHITECTURE。
4. **删除后验收**：运行目标测试与完整构建；用 `rg` 扫描旧路径；扫描 `dist/client`，确认不再包含被移除文件和本地/未清权媒体。
5. **回滚顺序**：先 revert 对应清理提交，再从归档恢复未跟踪文件到原绝对相对路径，最后逐文件核对 SHA-256。不要用 `git checkout` 期待恢复从未纳入 Git 的资产。
6. **发布事故处置**：若误删导致运行缺图/缺音，先恢复当前 KEEP 路径；若误发本地媒体，优先撤下部署或阻断静态路径，再做代码回退，不能只靠 UI 门控隐藏文件。

## 最终建议

- 可以优先执行批次 0 和批次 A；它们不改变产品设计方向，且都有明确重建路径或同哈希正本。
- 批次 B 要先做一次产品确认，因为“通用空位模板”与历史男女模板仍有迁移语义。
- 批次 C 的目标是把源资产/QA 证据从公开发布面迁出，不是销毁。
- 发布前必须解决批次 D；否则即使代码不播放，本地等待视频和测试音频仍会进入静态构建包。
