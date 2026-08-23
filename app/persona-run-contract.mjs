export const PERSONA_RUN_STATUS_LABELS = Object.freeze({
  idle: "未发送",
  creating: "创建中",
  continuing: "继续读取中",
  pending: "生成中",
  running: "生成中",
  completed: "已完成",
  incomplete: "读取不完整",
  error: "失败",
  demo: "演示模式",
});

export const PERSONA_RUN_ERROR_CODES = Object.freeze({
  BRIDGE_OFFLINE: { recovery: "重启开发服务后重试", terminal: false },
  CROSS_SITE_REQUEST: { recovery: "检查本地页面 Origin 后重试", terminal: true },
  INVALID_REQUEST_TOKEN: { recovery: "重新检测本地 Bridge 后重试", terminal: true },
  CLI_UNAVAILABLE: { recovery: "检查 YouNavi 与 agent-cli 后重试", terminal: true },
  SOURCE_MISSING: { recovery: "检查原始素材路径后重试", terminal: true },
  SOURCE_NOT_FULLY_READ: { recovery: "继续读取并生成", terminal: false },
  SKILL_NOT_ACTIVATED: { recovery: "重新创建并检查 Skill 激活证据", terminal: true },
  CONTINUATION_UNSUPPORTED: { recovery: "使用重新创建生成新 Run", terminal: true },
  CONTINUATION_STALLED: { recovery: "工具未返回 EOF 证据，请重新创建", terminal: true },
});

export function isCompleteRunCoverage(coverage) {
  return Boolean(Array.isArray(coverage) && coverage.length > 0 && coverage.every((item) => (
    item?.eof === true
    && Number.isFinite(Number(item.readLines))
    && Number.isFinite(Number(item.totalLines))
    && Number(item.readLines) >= Number(item.totalLines)
  )));
}

export function summarizeRunCoverage(coverage) {
  if (!Array.isArray(coverage) || coverage.length === 0) return "暂无读取覆盖证据";
  return coverage.map((item) => `${item.readLines ?? 0}/${item.totalLines ?? "?"} 行`).join("；");
}

export function normalizeRunError(code, message) {
  const normalizedCode = String(code || "RUN_FAILED").trim() || "RUN_FAILED";
  const detail = String(message || "Persona Run 失败").trim() || "Persona Run 失败";
  return { code: normalizedCode, message: detail, recovery: PERSONA_RUN_ERROR_CODES[normalizedCode]?.recovery || "查看错误详情后重试" };
}
