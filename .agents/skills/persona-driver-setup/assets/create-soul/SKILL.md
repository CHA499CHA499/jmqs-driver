---
name: create-soul
description: 从会议纪要、聊天记录、访谈、文章、播客等原始素材中蒸馏创建一个人的 AI 人物画像，产出 _persona/_quotes/_knowledge/_meta 多层认知资产；用于用户说 /create-soul、"创建人物"、"蒸馏 [某人]"、"给我做个 XX 的 AI 分身"、"create a persona for [name]" 时触发，不用于单篇文档总结、纯对话口吻模仿或一般的信息整理。
tags: [persona, distillation, ai-character, soul, create-soul]
arguments: "person_name"
version: 1.0.0
---

# /create-soul — 从原始素材蒸馏创建 AI 人物

从用户的原始素材（会议纪要、聊天记录、文章、播客/访谈转写、笔记等）中，结构化蒸馏出一个人物画像，产出可直接对话的 AI 人物技能目录。全程交互式引导。

来源：https://github.com/larashero3-dotcom/soul.skill（已转换安装并做 **YouNavi 原生采集器改造**）。改造要点：素材采集阶段新增双路径分流——**蒸馏用户自己**时优先读取 YouNavi 上下文（`navi-*` 会议转写/笔记/历史对话、飞书钉钉企微 CLI、用户指定本地文件夹），**蒸馏别人**时优先用 YouNavi 网页搜索/深度研究与播客转写 skill。详细操作手册见同目录 `collectors-youNavi.md`。原版辅助资源（collectors 脚本、docs 蒸馏指南、templates 模板、examples 示例）已随本 skill 部署或可从原仓库克隆获取。

## 流程总览

```
① 确认人物 → ② 采集素材 → ③ 蒸馏（3-Pass）→ ④ 组装 SKILL.md → ⑤ 验证 → ⑥ 安装到 YouNavi 并调用
```

## Step 1: 确认人物

问用户（若已通过参数传入 $person_name 则直接使用）：
1. **人物姓名**（中英文）
2. **一句话描述**（TA 是谁、做什么的）
3. **素材情况**——已有素材（文件/目录路径）还是需要现场采集？

从回答中确定：
- `{person_name}` — 人物名
- `{slug}` — 英文 slug（用于目录名和 skill 名，如 `wei-ran`）
- `{output_dir}` — 输出路径，默认 `./{slug}-soul/`

## Step 2: 采集素材

### 0. 分流：蒸馏自己 vs 蒸馏别人（先判断再采集）

先确认蒸馏目标，选择采集通道：

- **蒸馏用户自己** → 走 **模式 A：YouNavi 用户上下文采集**（会议录音转写 / 笔记 / 历史对话 / 飞书钉钉 CLI / 用户指定本地文件夹）
- **蒸馏别人** → 走 **模式 B：公网采集**（网页搜索与深度研究 / 播客转写 / 原版 collectors 脚本）

详细操作手册见同目录 **`collectors-youNavi.md`**（YouNavi 原生采集器）。本节是主流程摘要。

### 如果用户已有素材目录/文件
直接读取（支持 .md/.txt/.docx/.pdf 转写文本），列出文件清单，跳到 Step 3。

### 模式 A：蒸馏用户自己（YouNavi 原生通道，重点）

优先用 YouNavi 内置工具采集用户自己的上下文资产，按优先级：

1. **会议录音（核心，必须）**：用户在真实会议中的发言是密度最高的素材
   - 主动同步：`navi_action.sync_meeting` 拉取会议录音转写（腾讯会议 / 飞书妙记 / 钉钉听记 / Plaud / Get笔记 / 通义听悟 / 千问录音 / 讯飞听见 / TicNote）；同步是异步操作，完成后用 `find_files` 定位新转写文件
   - 检索既有转写：`find_files` / `retrieve_local_evidence`（records 来源加权）定位 `navi-*` 转写文本，`read_text_file` 读全文；原始音频/视频用 `transcribe_audio` 转写
2. **用户上下文核心（必须）**：笔记、历史对话、长期记忆
   - `find_files` / `retrieve_local_evidence` 语义检索笔记与历史对话（notes/conversation 来源加权）；`recall_context` 单次精确定位具体对话片段，`recall_research` 深度回溯观点演变
   - `navi_action.list_memory_files` 列出记忆文件（auto-memory、常用人名表、全局记忆等），`read_text_file` 读取——身份、偏好、人脉线索密度高
   - 检索可传 `time_range` 限定时间段（如近 6 个月/1 年），聚焦近期状态
3. **CLI 渠道（可选，须征得用户同意）**：读取 IM 中的用户发言与会议纪要
   - 飞书 → `lark-context`；钉钉 → `dingtalk-context`；企业微信 → `wecom-context`；腾讯会议 → `tencent-meeting-context`（未装 CLI 先走对应 setup）
   - 按主题过滤，只取目标用户本人的发言（按消息 sender 过滤），落盘到 `_raw/im/`
4. **用户指定本地文件夹（可选）**：`list_dir` 浏览 → `grep_search` 定位 → `read_text_file` / `render_file_to_text` 读取（支持 md/txt/docx/pdf/pptx/xlsx）

**强制规则（蒸馏自己）**：会议录音/群聊中他人发言必须剔除或标注（发言人纯化），只保留用户本人观点；隐私边界先与用户确认范围（不采集无关的他人隐私、不读取与画像无关的敏感内容）。

### 模式 B：蒸馏别人（公网通道）

1. **网页搜索与深度研究（主通道）**：
   - `web_search` 摸底目标人物公开语料分布
   - `web_fetch` 抓取已知 URL 全文转 markdown
   - `web_research` 多源对照综合，交叉验证观点；返回的 URL+时间保留为溯源依据
2. **播客 / YouTube（主通道）**：激活「播客转写与总结」skill（输入播客链接自动下载→转写→分析）；本地音频文件用 `transcribe_audio`
3. **原版 collectors 脚本（兜底）**：`collectors/jike_export.py`（即刻）、`collectors/twitter_archive.py`（Twitter 自助导出包，仅限本人）

### 采集规则（两种模式通用）
- 每个采集来源的输出存入 `{output_dir}/_raw/` 对应子目录（`self/`、`im/`、`local/`、`web/`、`podcast/`、`social/` 等）
- 每个素材保留 frontmatter 元数据：`source_type` / `source_url` / `author` / `date` / `collected_at`（溯源与观点演变追踪）
- 采集完成后输出清单：文件名、类型、字数、来源
- **最低门槛**：至少 5 个素材文件或累计 1 万字。不足时提醒用户补充，但不强制阻断

## Step 3: 蒸馏（3-Pass）

### Pass 1: 逐篇阅读 + 标注

读取 `_raw/` 下所有文件。对每篇素材：
1. **完整阅读**（不跳读、不只看前几行）
2. 提取以下信号：
   - 观点与立场（含具体表述）
   - 思维方式（如何推理、举例、下判断）
   - 语言特征（口头禅、句式节奏、用词偏好）
   - 情绪与态度（什么让 TA 兴奋/愤怒/犹豫）
   - 值得保留的原话（quote-worthy）
3. 按类型标注：人格信号 / 知识信号 / 混合

**检查点**：输出阅读进度，确认每篇都读了。

### Pass 2: 聚合 + 去重

按主题聚合所有信号：
- 合并语义重复的观点（保留表达最好的版本）
- 识别核心主题（3-8 个）
- 标注立场演变（同一话题不同时期的表态）
- 筛选 top 引语（≥20 条）

### Pass 3: 结构化写作

将聚合结果写入以下文件：

#### `_persona/rules.md`
- 身份信息（现在做什么、过去做过什么、公众存在感）
- 核心人格特质（5-8 条，每条附证据）
- 思维框架（TA 特有的分析方式，不是通用框架）
- 决策风格
- 口头禅（原话）
- 硬边界（TA 绝对不会说/做的事，≥5 条）

#### `_persona/communication.md`
- 语言模式（至少区分 2 种场景，每种附 ≥8 条真实句式样本）
- 长文 vs 短文的风格差异
- 口语特征（如果有播客素材）
- 标点和排版习惯
- 语言混用规则（中英文切换习惯）

#### `_persona/values.md`
- 分层级排列信念（深度信仰 / 强倾向 / 探索中）
- 每条附原话引用
- 信念演变轨迹（如果素材跨时间段）

#### `_knowledge/{topic}.md`（每个核心主题一个文件）
- 核心观点（附原话）
- 观点演变
- 推理链路（TA 为什么这么想）

#### `_quotes/iconic.md`
- ≥20 条代表性引语，按主题分组
- 标注来源

#### `_quotes/internal.md`（如果有非正式素材）
- 私下/随意场合的原话
- 展示 TA 不端着时的样子

#### `_meta/sources.md`
- 素材清单 + 覆盖率

## Step 4: 组装 SKILL.md

在 `{output_dir}/` 根目录生成 `SKILL.md`（模板如下，供后续直接安装为独立技能）：

```markdown
---
name: {slug}-chat
description: "Chat with AI {person_name}. Distilled from {N} sources."
---

# AI {person_name}

You are **{person_name}**, {一句话描述}.

## Activation

1. Load persona files:

./_persona/rules.md
./_persona/communication.md
./_persona/values.md
./_quotes/iconic.md
./_quotes/internal.md

2. Load knowledge docs on demand — only when the conversation topic matches:

./_knowledge/

## Core Rules

### Identity
{从 rules.md 提取 3-5 条核心身份描述}

### Thinking Style
{从 rules.md 提取思维方式要点}

### Language
{从 communication.md 提取关键语言规则}

### Hard Boundaries
{从 rules.md 提取硬边界清单}

### Catchphrases
{从 rules.md 提取口头禅}

## Start

Use the user's first message as input and respond in character.
```

## Step 5: 验证

### 完整性检查

输出 checklist：
```
□ _persona/rules.md — 身份 + 人格 + 思维框架 + 硬边界 ≥5 条
□ _persona/communication.md — ≥2 种语言模式，每种 ≥8 条真实句式
□ _persona/values.md — 分层信念 + 引用
□ _knowledge/ — ≥2 个主题文件
□ _quotes/iconic.md — ≥20 条引语
□ _meta/sources.md — 素材覆盖率
□ SKILL.md — 完整可用
```
有缺项先补，再继续。

### 还原度测试

用生成的 persona 模拟回答 3 个问题：
1. 一个 TA 擅长领域的观点问题
2. 一个闲聊/轻松话题
3. 一个 TA 可能不懂的领域（测试边界）

输出模拟结果，让用户判断像不像。

## Step 6: 安装到 YouNavi 技能目录并调用（先装后用）

生成的 `{slug}-soul/` 即为一个完整的 YouNavi skill。**必须先把它安装进技能目录，再在对话中输入 `/{slug}-chat` 调用**——YouNavi 只会索引工作区 `skills/` 下的技能，直接输入斜杠命令不会凭空生效。

### 6.1 安装步骤（把生成的 skill 装进 YouNavi）

1. **确认产物结构完整**：`{slug}-soul/` 根目录下必须有 `SKILL.md`（含合法 frontmatter），且 `_persona/`、`_quotes/`、`_knowledge/`、`_meta/` 等资产目录与 `SKILL.md` 处于**同一层级**（SKILL.md 内部用 `./_persona/...` 相对路径加载，目录层级破坏会导致资产加载失败）。缺 `SKILL.md` 或 frontmatter 不完整则先回到 Step 4 补全，不要安装。
2. **定位技能目录**：工作区 `skills/` 目录，即当前会话工作目录下的 `skills/`（形如 `/Users/<用户名>/navi-ai/<工作区名>/skills/`）。若不存在，先创建：
   ```bash
   mkdir -p skills
   ```
3. **整体拷贝 `{slug}-soul/` 目录**：把**整个目录**（不是只拷 SKILL.md，也不是只拷 `_persona/`）复制或移动到 `skills/` 下，最终路径为 `skills/{slug}-soul/SKILL.md`：
   ```bash
   cp -r {slug}-soul/ skills/
   # 或 mv {slug}-soul/ skills/
   ```
   保持 `SKILL.md` 与各资产子目录的相对关系不变，否则角色资产会加载不全。
4. **核对 frontmatter**：打开 `skills/{slug}-soul/SKILL.md`，确认以下字段可被 YouNavi 识别：
   - `name`：必须是 `{slug}-chat`——这就是斜杠触发名（如 `lei-jun-chat`），与输入的命令严格一致
   - `description`：写明触发场景与用途（如"与 AI {person_name} 对话"），YouNavi 据此做斜杠命令匹配和语义自动匹配
   - YAML 语法无误（引号、冒号、缩进不破坏解析）
5. **刷新技能索引**：安装后 YouNavi 会扫描技能目录。若当前对话已打开，技能列表可能未及时刷新——新开一个对话，或直接输入 `/{slug}-chat` 观察是否有补全/触发提示来确认已被识别。

### 6.2 调用方式

1. 在对话中直接输入 **`/{slug}-chat`** 即可与 AI {person_name} 对话；skill 会按 `SKILL.md` 的 Activation 指令加载 `_persona/`、`_quotes/` 资产并进入角色。
2. 对话过程中按需加载 `_knowledge/{topic}.md` 补充领域知识；用户也可追问具体话题，skill 会自行读取对应知识文档。

### 6.3 排查：`/{slug}-chat` 未被识别

按顺序检查：
- **目录位置**：确认最终路径为 `skills/{slug}-soul/SKILL.md`，而不是 `skills/` 的更深层嵌套（如 `skills/xxx/{slug}-soul/`），或目录被放在工作区外
- **frontmatter**：`name` 字段是否与输入的命令一致（`{slug}-chat`）、`description` 是否非空、YAML 是否有语法错误
- **索引刷新**：技能列表在会话加载时快照，需**新开对话**或重发消息让索引生效；老对话中可能识别不到新装技能
- **重名冲突**：`skills/` 下已有同名目录会被覆盖或冲突，先移除旧目录再安装

### 6.4 更新与卸载

- **更新**：重新生成后覆盖拷贝 `skills/{slug}-soul/` 即可，新开对话生效
- **卸载**：删除 `skills/{slug}-soul/` 整个目录即从 YouNavi 移除，不影响原始产物（如需保留可先移回工作区其他位置）

## 辅助资源索引

以下资源已随本 skill 部署在 `skills/create-soul/` 下：

- **`collectors-youNavi.md`** — ⭐ YouNavi 原生采集器（本次改造核心）：双路径分流、工具调用清单、发言人纯化与元数据规则。Step 2 采集时优先查阅。
- `collectors/` — 原版素材采集脚本（无需 API key，蒸馏别人时的兜底通道）：`jike_export.py`（即刻主页导出）、`twitter_archive.py`（Twitter 导出包解析）、`README.md`、`requirements.txt`（URL 抓取走 `web_fetch`、YouTube/播客走「播客转写与总结」skill，不再依赖脚本）
- 其余原仓库资源（`docs/distillation-guide(.zh-CN).md` 蒸馏方法论、`templates/` 输出模板、`examples/wei-ran/` 完整示例）未随 skill 复制，需要时从 https://github.com/larashero3-dotcom/soul.skill 克隆获取

若采集工具链全部不可用，替代方式：直接请用户粘贴文本/转写内容，或先用任意方式将 URL 内容转为 Markdown 放入 `_raw/`，蒸馏流程不受影响。

## 行为规则

1. **逐篇读完再写**。不允许只扫前几行就开始生成。
2. **原话优先**。communication.md 和 quotes 里必须是素材中的原文，不是 AI 改写。
3. **不编造**。素材里没有的信息，不猜测、不补全。在文件中标注"素材未覆盖"。
4. **硬边界要具体**。不写"不使用低俗语言"这种废话，写"不说 XXX"这种能直接执行的规则。
5. **素材不够就说不够**。如果素材太少（<5 个文件），生成基础版并明确告诉用户哪些维度缺素材。
6. **多源人物素材需先做发言人纯化**：会议纪要/访谈中混有他人发言时，先剔除或标注非目标人物的观点，避免把他人偏好蒸馏进画像。**蒸馏用户自己时此规则强制**：只保留用户本人原话/立场/推理，他人发言一律剔除或标注「speaker 未确认」。
7. **蒸馏自己时先确认采集范围与隐私边界**：读取 `navi-*` 文件、飞书/钉钉/企微 CLI 内容前，向用户说明将采集哪些来源，不采集无关的他人隐私。
8. **YouNavi 工具优先**：采集素材时优先使用 `find_files` / `retrieve_local_evidence` / `read_text_file` / `transcribe_audio` / `web_search` / `web_fetch` / `web_research` / `recall_research` 等内置能力与已装 CLI skill，而非让用户手动导出文件。
