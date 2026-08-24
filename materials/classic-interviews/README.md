# 内置经典访谈材料

这四份 UTF-8 TXT 是 Persona Driver 固定能量棒的随仓输入。用户于 2026-08-24 明确要求内置，使 YouNavi 中的 Setup Skill 不再询问材料目录。

- `FuVenture_乔布斯盖茨D5大会对话_转写文本.txt`
- `乔布斯访谈1990_转写文本.txt`
- `比尔盖茨_TED_Interview_原转写.txt`
- `梁文道_一千零一夜_活着二_转写文本.txt`

`manifest.json` 固定每份文件的实际字节数和 SHA-256；Setup Skill、Bridge health 和测试均以该目录为默认真源。替换内容必须同步 manifest、CHANGELOG、INTERFACE 和测试，不能只覆盖文件。

这些材料只作为 Persona Driver 本地分析上下文，不授权 Agent 扩展搜索其它目录，也不授权将内容上传到其它服务。
