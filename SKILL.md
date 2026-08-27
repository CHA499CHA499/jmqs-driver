---
name: jmqs-driver
description: 启动、调试和维护仓库中的 JMQS Driver Persona 工作台；适用于卡包、人物卡、能量棒/技能棒、腰带合体、YouNavi Bridge 和结果阅读器相关任务。
exposure: on-trigger
---

# Persona Driver

这是 YouNavi 导入和检索本项目时读取的根入口。`${SKILL_DIR}` 就是完整 Persona Driver 项目根目录；不要把 `.agents/skills/persona-driver-setup/` 当成需要用户单独导入的 Skill。

## 用户如何使用

- 首次使用：把包含本文件的整个文件夹导入 YouNavi，然后说“安装并启动 Persona Driver”。
- 后续启动：说“启动 Persona Driver”。
- 环境异常：说“检查 Persona Driver”或“修复 Persona Driver 环境”。
- 只想了解项目：读取 `${SKILL_DIR}/README.md`，不要执行安装。

默认用户已经在 YouNavi 中使用本 Skill；不要新增或检查 YouNavi 首次登录流程。

## Agent 执行入口

项目自带四份固定访谈材料、五个人物 Skill、`create-soul` 和确定性安装脚本。不要在用户主目录搜索材料、项目副本或凭证。

1. 将 `${SKILL_DIR}` 作为唯一项目根目录。
2. 安装脚本会把 `${SKILL_DIR}` 的父目录识别为 YouNavi Skills 根目录；如果运行环境明确提供 `PERSONA_NAVI_SKILLS_DIR`，优先使用该值。
3. 先执行只读检查：

   ```bash
   node "${SKILL_DIR}/.agents/skills/persona-driver-setup/scripts/setup.mjs" doctor --project "${SKILL_DIR}"
   ```

4. 如果用户要求首次安装或修复，执行：

   ```bash
   node "${SKILL_DIR}/.agents/skills/persona-driver-setup/scripts/setup.mjs" install --project "${SKILL_DIR}" --no-start --no-open
   ```

   脚本只从包内复制缺失的五个人物 Skill 和随包 `create-soul`，校验它们的来源 commit、文件数量、字节数与 SHA-256，同时校验四份内置原文，生成被忽略的 `.env.local`，运行 `npm ci` 与测试。已有但名称冲突的 Skill 必须停止并报告，禁止覆盖。

5. 安装完成或 doctor 已显示 ready 后，由 Agent 在 `${SKILL_DIR}` 直接启动长任务：

   ```bash
   npm run dev
   ```

6. 确认以下两个地址都返回 HTTP 200 后，再打开页面：

   - `http://localhost:3000/`
   - `http://127.0.0.1:8766/health`

不要让安装脚本嵌套托管长期 dev 进程；启动、健康检查和打开页面由当前 Agent 直接完成。

## 完成标准

只有以下条件同时成立才报告成功：

- Node 版本不低于 22.13；
- 四份内置材料通过 manifest 字节数与 SHA-256 校验；
- 五个人物 Skill 与 `create-soul` 均可见；
- 安装测试通过；
- Web 与 Bridge 均返回 HTTP 200；
- 已向用户报告项目根目录、Skills 根目录和打开地址。

五个人物 Skill 的首次安装禁止访问 GitHub 或依赖代理；固定来源与 commit 只用于随包 provenance。不要安装其他版本，也不要修改 YouNavi 认证状态。

如果脚本仍无法确定 Skills 根，只在这时读取当前 Skill 目录的父目录，并用 `--skills-dir <该绝对路径>` 重试；禁止搜索用户主目录。
