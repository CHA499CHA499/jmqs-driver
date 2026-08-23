import assert from "node:assert/strict";
import test from "node:test";
import { isCompleteRunCoverage, normalizeRunError, PERSONA_RUN_ERROR_CODES, PERSONA_RUN_STATUS_LABELS, summarizeRunCoverage } from "../app/persona-run-contract.mjs";

test("shared Persona Run contract gates result readiness on complete coverage", () => {
  assert.equal(PERSONA_RUN_STATUS_LABELS.incomplete, "读取不完整");
  assert.equal(isCompleteRunCoverage([{ readLines: 454, totalLines: 455, eof: false }]), false);
  assert.equal(isCompleteRunCoverage([{ readLines: 455, totalLines: 455, eof: true }]), true);
  assert.equal(summarizeRunCoverage([{ readLines: 454, totalLines: 455 }]), "454/455 行");
  assert.equal(normalizeRunError("SOURCE_NOT_FULLY_READ", "未读到 EOF").recovery, "继续读取并生成");
  assert.equal(PERSONA_RUN_ERROR_CODES.CONTINUATION_STALLED.terminal, true);
});
