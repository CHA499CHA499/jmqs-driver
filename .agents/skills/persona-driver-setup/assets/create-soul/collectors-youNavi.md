# YouNavi 原生采集器（Collectors-youNavi）

> 本文件是 create-soul「素材采集」阶段的 **YouNavi 增强版通道**，替代/扩展原版 `collectors/README.md` 的纯脚本方案。核心思路：**不依赖用户手动提供 URL 或导出包**，直接调用 YouNavi 内置工具与已装 CLI，从用户自己的上下文资产（会议录音、笔记、历史对话、IM）和公网（网页、深度研究、播客）中采集素材。

---

## 双路径分流（Step 2 入口判断）

进入采集阶段先判断**蒸馏目标是谁**，走不同通道：

| 蒸馏目标 | 判断依据 | 主通道 | 备选通道 |
|---|---|---|---|
| **用户自己** | 用户说"蒸馏我"、"给我做个 AI 分身"、"我的画像"；或目标是当前用户本人 | A. 用户上下文（会议同步 / navi-* 文件 / CLI / 本地文件夹） | 用户主动粘贴的文本 |
| **别人** | 目标是第三方（访谈嘉宾、创始人、KOL、历史人物等） | B. 公网（网页 / research / 播客） | 原版 collectors 脚本 |

> 不确定时先问一句："这次蒸馏的对象是你自己，还是别人？" 这决定采集通道，答错会导致画像失真（例如把会议里别人的观点蒸进你的画像）。

---

## 模式 A：蒸馏用户自己

> 目标：把用户散落在会议录音、笔记、历史对话、IM 里的「决策逻辑、观点立场、语言习惯」归集为画像素材。**YouNavi 的强项：用户上下文已经在本地/云端索引、会议录音可主动同步，无需用户手动导出。**

### A1. 会议录音同步（核心，必须）

用户在真实会议里的发言是密度最高的素材——决策逻辑、表达习惯、情绪态度都在里面。两类来源：

**① 主动同步（无现成转写文件时先做这步）**：`navi_action.sync_meeting` 拉取用户各平台的会议录音转写：

| 平台 | 同步 channel | 已装 CLI 时的替代查法 |
|---|---|---|
| 腾讯会议 | `sync_meeting(channel="tencent_meeting")` | `tencent-meeting-context`（tmeet CLI）查智能纪要/报告 |
| 飞书妙记 | `sync_meeting(channel="feishu_miaoji")` | `lark-context` 查妙记 |
| 钉钉听记 | `sync_meeting(channel="dingding_shanji")` | `dingtalk-context` 查听记 |
| Plaud / Get笔记 / 通义听悟 / 千问录音 / 讯飞听见 / TicNote | 对应 `sync_meeting(channel=...)` | — |

同步是**异步操作**：启动后等待片刻，再用 `find_files` 查找今天新增的转写文件并读取。

**② 检索既有转写**：`find_files`（语义搜）或 `retrieve_local_evidence`（records 来源加权）定位 `navi-*` 开头的转写/会议记录；`read_text_file` 读全文；若只有原始音频/视频，用 `transcribe_audio` 转写后再纳入。

### A2. 用户上下文核心（必须）

| 来源类型 | 检索工具 | 说明 |
|---|---|---|
| 笔记 | `find_files` / `retrieve_local_evidence`（notes 来源加权） | 用户保存的笔记、工作文档 |
| 历史对话 | `recall_context`（单次精确定位）+ `recall_research`（深度回溯）/ `retrieve_local_evidence`（conversation 来源加权） | 用户与 Navi 的长对话本身也是素材（决策过程、追问逻辑、提问方式） |
| 长期记忆 | `navi_action.list_memory_files` 列出 → `read_text_file` 读取；`recall_research`（cognition 来源） | auto-memory、常用人名表、全局记忆等文件已沉淀身份/偏好/人脉线索，密度高 |
| 当前会话附件 | `retrieve_local_evidence`（uploads 来源加权） | 本对话中用户上传/引用的文件也可能是素材 |
| 已同步的本地文件 | `retrieve_local_evidence`（work_dir 来源） | 工作区及最近使用的本地目录 |

**操作要点：**
- 检索可传 `time_range` 限定时间段（如近 6 个月/1 年），聚焦用户近期状态；需要观点演变时再放宽到更长窗口。
- 先 `find_files` 按语义定位候选文件（如「我的复盘笔记」），再 `read_text_file` 读取关键文件全文；不要只读文件名。
- 每次采集把文件复制/落盘到 `{output_dir}/_raw/self/` 下，保留元数据（见「通用规则」）。

### A3. CLI 渠道（可选，用户同意后使用）

读取用户在飞书/钉钉/企微/腾讯会议里的公开上下文（群聊讨论、会议纪要、日程），**必须先征得用户同意**，且只采与画像相关的主题：

| 平台 | 激活 skill | 典型采集内容 |
|---|---|---|
| 飞书 | `lark-context` | 群聊消息（用户发言）、妙记/会议纪要、文档 |
| 钉钉 | `dingtalk-context` | 群聊消息、听记/会议纪要、日程 |
| 企业微信 | `wecom-context` | 群聊消息、会议纪要、日程、智能表格 |
| 腾讯会议 | `tencent-meeting-context` | 会议列表、智能纪要、会议报告 |

**操作要点：**
- 未安装 CLI 时先走 `lark-cli-setup` / `dingtalk-setup` / `wecom-setup` / `tencent-meeting-setup` 安装。
- 拉取后按主题过滤（如「只取用户在战略/产品讨论中的发言」），落盘到 `{output_dir}/_raw/im/`。
- **发言人纯化**：群聊消息按 sender 字段过滤出用户本人的发言；会议纪要按说话人标签过滤，无法区分的段落标注「speaker 未确认」（见「通用规则」）。

### A4. 用户指定本地文件夹（可选）

用户给了一个文件夹路径时：
1. `list_dir` 浏览结构，确定范围（建议先看顶层，再决定是否递归）。
2. 用 `grep_search` 按关键词定位候选文件，`read_text_file` 读取内容。
3. 支持的格式：`.md` / `.txt` 直接读；`.docx` / `.pdf` / `.pptx` / `.xlsx` 用 `render_file_to_text` 解析为 markdown 后纳入。
4. 全部落盘到 `{output_dir}/_raw/local/`。

---

## 模式 B：蒸馏别人

> 目标：从公网（文章、访谈、播客、社交动态）采集目标人物的公开言行。**YouNavi 的强项：内置网页抓取与深度研究，无需用户手动复制粘贴；播客走专用 skill 自动转写。**

### B1. 网页搜索与深度研究（主通道，替代 fetch_url.py）

| 场景 | 工具 | 说明 |
|---|---|---|
| 单点查证/找来源 | `web_search` | 搜索目标人物名字 + 主题（访谈、观点、文章） |
| 已知 URL 抓全文 | `web_fetch` | 抓取具体文章/博客/访谈页，转 markdown |
| 多源对照综合 | `web_research` | 一次调研多个来源，交叉验证观点与事实，返回带 URL 引用的结论 |

**操作要点：**
- 先用 `web_search` 摸清目标人物的公开语料分布（官网/博客/访谈/专栏/播客）。
- 重点抓**长访谈和播客逐字稿**——人格信号密度远高于精修文章。
- `web_research` 返回的引用（URL + 标题 + 时间）直接保留为 `_meta/sources.md` 的溯源依据。
- 每篇落盘到 `{output_dir}/_raw/web/`，frontmatter 记 `source_url` 与抓取日期。

### B2. 播客 / YouTube 字幕（主通道，替代 youtube_transcript.py）

- **首选**：激活「播客转写与总结」skill——输入播客链接（小宇宙/Spotify/YouTube 等），自动完成下载 → 转写 → 分析 → 总结，返回转写文本 + shownotes 结合的建议。
- 备选：若用户手头有本地音频/视频文件，用 `transcribe_audio` 转写。
- 落盘到 `{output_dir}/_raw/podcast/`。

### B3. 原版 collectors 脚本（兜底，保留原能力）

原版脚本已随 skill 部署在 `collectors/` 下，用于原版覆盖的场景（用户提供了 URL 列表、Twitter 导出包、即刻主页等）：

| 脚本 | 用途 | 何时用 |
|---|---|---|
| `collectors/jike_export.py` | 即刻主页 → 动态 | 目标人物在即刻活跃时 |
| `collectors/twitter_archive.py` | Twitter 自助导出包 → 推文 | **仅限本人导出包**（对方不配合则拿不到，README 有说明） |

> URL 批量抓取（原 fetch_url.py）已由 B1 的 `web_fetch` / `web_research` 完全替代；YouTube 字幕（原 youtube_transcript.py）由 B2 的「播客转写与总结」skill 替代，不再维护脚本。

运行方式：`python collectors/<script>.py <参数> -o {output_dir}/_raw/social/`，依赖 `pip install requests`。

---

## 通用规则（两种模式都适用）

1. **输出目录统一**：所有采集结果进入 `{output_dir}/_raw/` 下按来源分类的子目录（`self/`、`im/`、`local/`、`web/`、`podcast/`、`social/`、`writing/`）。
2. **元数据必留**：每个素材文件头部保留 frontmatter：
   ```yaml
   ---
   source_type: transcript | article | note | chat | podcast | ...
   source_url: <原始 URL 或本地路径>
   author: <目标人物名，或 "self">
   date: <素材产生时间，若可知>
   collected_at: <采集时间>
   ---
   ```
   日期用于追踪观点演变，URL/路径用于 `_meta/sources.md` 溯源。
3. **发言人纯化（蒸馏自己时强制）**：会议录音/群聊/访谈中混有他人发言时，**剔除或明确标注**非目标人物的观点；只保留用户本人的原话、立场与推理。执行办法：转写文本按说话人过滤，无法区分的段落标注「speaker 未确认」。
4. **隐私边界**：采集用户自己的上下文（A1/A2/A3）前确认范围；CLI 渠道（A2）必须征得同意，不采集无关的他人隐私。
5. **最低门槛**：至少 5 个素材文件或累计 1 万字（自己蒸馏时，若会议+笔记覆盖不足，主动提示用户补充，但不强制阻断）。
6. **采集后自检**：输出清单（文件名 / 类型 / 字数 / 来源），并确认每条素材都进入 `_raw/` 后再进入 Step 3 蒸馏。
