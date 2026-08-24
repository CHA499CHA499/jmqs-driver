# Collectors

Lightweight scripts for gathering raw material before distillation. All scripts output markdown files to your `_raw/` directory.

## Requirements

```bash
pip install requests
```

No API keys needed. No heavy dependencies.

## Scripts

### `twitter_archive.py` — Twitter/X 自助导出 → Markdown

**仅限自助导出场景**：解析你自己的 Twitter 官方数据导出包（Settings → Your Account → Download an archive of your data），提取推文、回复、引用推到结构化 markdown。

```bash
# 指向你解压后的 archive 目录
python collectors/twitter_archive.py ~/Downloads/twitter-archive/ -o _raw/social/
```

导出步骤：[Twitter → Settings → Your Account → Download an archive of your data](https://twitter.com/settings/download_your_data)，Twitter 需要 24-48 小时准备。

> **⚠️ 重要限制：这个脚本只能处理你自己账号的导出数据。**
>
> X/Twitter 的现状是：自动抓取他人推文几乎不可行——
> - **官方 API**：免费层级已基本不可用，付费 API（Basic $100/月起）才能批量读取，违反本工具集"零 API key"原则
> - **爬虫 / 第三方工具**：X 反爬极其激进（频繁改版、IP 封禁、登录墙），不稳定且违反 ToS
>
> **如果目标人物不配合提供自己的导出包，推特数据基本拿不到。** 建议用其他来源补偿：
> - **即刻**：用 `jike_export.py` 采集，很多中文圈 KOL 在即刻更活跃
> - **博客 / Newsletter**：用 YouNavi 的 `web_fetch` / `web_research` 抓取（见 `../collectors-youNavi.md`）
> - **播客 / YouTube**：用 YouNavi 的「播客转写与总结」skill 拿逐字稿，人格信号往往比推文更丰富

### `jike_export.py` — 即刻 (Jike) Posts → Markdown

Extracts posts from a 即刻 user profile. Requires the user's profile URL.

```bash
python collectors/jike_export.py "https://web.okjike.com/u/xxxxx" -o _raw/social/
```

> Note: 即刻 has no official API. This script uses the web interface and may break if 即刻 changes their site. For reliability, consider manually exporting via the 即刻 app's "我的动态" feature.

## What These Scripts Don't Cover

Some sources require heavier tools or manual work:

| Source | Recommended Approach |
|--------|---------------------|
| **Podcasts / audio** | 用 YouNavi 的「播客转写与总结」skill（输入播客链接自动下载→转写→分析）；本地音频用 `transcribe_audio` |
| **WeChat articles (公众号)** | 用 YouNavi 的 `web_fetch` 先试（部分可用）。若被拦截，手动复制粘贴或使用 [WeChatDownload](https://github.com/AntoineDly/WeChatDownload)。 |
| **Weibo** | No reliable open tool. Manual export or browser automation. |
| **Chat logs (WeChat/Slack/Discord)** | Export from the platform (Slack: workspace export; Discord: [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter); WeChat: backup tools). Always get permission first. |
| **Books / PDFs** | [PyMuPDF](https://pymupdf.readthedocs.io/) or [pdfplumber](https://github.com/jsvine/pdfplumber) for text extraction. |

## Output Format

All scripts output markdown files with a consistent frontmatter:

```yaml
---
source_type: tweet | article | transcript | post
source_url: https://...
author: Person Name
date: 2025-01-15
collected_at: 2026-03-30
---
```

This makes it easy for the distillation pipeline to process the corpus.

## Tips

- **More is better.** Don't pre-filter — collect everything and let the distillation pipeline sort it out.
- **Preserve metadata.** Dates matter for tracking belief evolution. URLs matter for source attribution.
- **Prioritize interviews and casual content.** Polished articles show how someone writes; podcasts and social posts show how someone thinks.
