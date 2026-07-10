import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const required = [
  "AGENTS.md",
  "docs/index.md",
  "docs/architecture.md",
  "specs/promotion-stacking.md",
  "specs/inventory-reservation.md",
  "plans/current-task.md",
  "state/progress.md",
  "evals/cases.json"
];

const failures = required.filter((file) => !existsSync(resolve(root, file)));
const evals = JSON.parse(readFileSync(resolve(root, "evals/cases.json"), "utf8"));
if (!Array.isArray(evals.cases) || evals.cases.length < 3) failures.push("evals/cases.json:cases");

for (const spec of ["specs/promotion-stacking.md", "specs/inventory-reservation.md"]) {
  const text = readFileSync(resolve(root, spec), "utf8");
  for (const section of ["## Objective", "## Invariants", "## Acceptance cases"]) {
    if (!text.includes(section)) failures.push(`${spec}:${section}`);
  }
}

if (failures.length) {
  console.error("Overlay verification failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Overlay verification passed: ${required.length} files, ${evals.cases.length} eval cases.`);
}
