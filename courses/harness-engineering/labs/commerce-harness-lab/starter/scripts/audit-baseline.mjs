import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const checks = [
  ["missing-root-instructions", !existsSync(resolve(root, "AGENTS.md")), "根目录没有任务入口和验证说明"],
  ["conflicting-promotion-doc", readFileSync(resolve(root, "docs/legacy/promotion-rules.md"), "utf8").includes("待产品确认"), "促销组合规则仍有待确认项"],
  ["shared-policy-ignored", readFileSync(resolve(root, "packages/promotion-engine/src/index.js"), "utf8").includes("没有读取 policy"), "共享引擎忽略组合策略"],
  ["no-durable-state", !existsSync(resolve(root, "state/progress.md")), "没有跨会话进度文件"]
];

console.log("Starbridge baseline audit");
for (const [id, found, message] of checks) {
  console.log(`${found ? "FOUND" : "MISSING"} ${id}: ${message}`);
}

if (checks.some(([, found]) => !found)) process.exitCode = 1;
