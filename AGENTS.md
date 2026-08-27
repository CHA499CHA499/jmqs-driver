# Persona Driver 项目指令

@INDEX.md

## 触发口令

| 用户/上下文出现 | 加载 |
|---|---|
| 安装 Persona Driver / 启动 Persona Driver / 修复环境 / 一键安装 / jmqs-driver | `SKILL.md`（YouNavi 根入口，`exposure: on-trigger`） |

## 维护边界

- 当前代码、测试和 `INDEX.md` 是事实源；历史资产只在项目外归档。
- 根目录 `SKILL.md` 是 YouNavi 导入、检索和用户安装指引的唯一外部 Skill 入口；`.agents/skills/persona-driver-setup/` 仅承载安装实现与兼容说明。
- 修改 Bridge、安装脚本或运行路径时同步 README、CHANGELOG、INTERFACE、ROLLBACK、INDEX 与 `docs/ARCHITECTURE.md`。
- `.env.local`、`.persona-runs/`、`.local/`、用户 Skills 与 Soul 输出不得提交。
- 完成修改后运行 `npm test`、`npm run lint`、`npx tsc --noEmit` 和 `git diff --check`。
