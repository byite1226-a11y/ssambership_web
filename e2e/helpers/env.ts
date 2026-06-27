import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** .env.local을 수동 파싱(테스트 프로세스에 자동 주입되지 않으므로). */
export function loadEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[m[1]] = v;
    }
  } catch {
    // ignore
  }
  return out;
}
