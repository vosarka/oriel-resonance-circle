import { writeFileSync } from "node:fs";
import {
  ORIEL_GRAND_PROMPT_OUTPUT_PATH,
  buildOrielGrandSystemPrompt,
} from "../../shared/oriel/oriel-canonical-source";

const prompt = buildOrielGrandSystemPrompt();
writeFileSync(ORIEL_GRAND_PROMPT_OUTPUT_PATH, prompt, "utf8");

console.log(`[sync-oriel-grand-prompt] Wrote ${ORIEL_GRAND_PROMPT_OUTPUT_PATH}`);
