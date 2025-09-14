import { promises as fs } from "node:fs";
import path from "node:path";
import { getEnv } from "./env.js";

type Level = "debug" | "info" | "warn" | "error";

const levelPriority: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const dataDir = path.join(process.cwd(), "data");
const logFile = path.join(dataDir, "logs", "app.jsonl");

async function ensureLogDir() {
  await fs.mkdir(path.dirname(logFile), { recursive: true });
}

function getMinLevel(): Level {
  const env = getEnv();
  return (env.LOG_LEVEL as Level) || "info";
}

async function writeToFile(line: string) {
  const env = getEnv();
  if (env.LOG_TO_FILE !== "true") return;
  await ensureLogDir();
  await fs.appendFile(logFile, line + "\n");
}

export function createLogger(context?: Record<string, unknown>) {
  const min = getMinLevel();
  const minPriority = levelPriority[min];

  function log(level: Level, msg: string, fields?: Record<string, unknown>) {
    if (levelPriority[level] < minPriority) return;
    const payload = { ts: new Date().toISOString(), level, msg, ...context, ...(fields || {}) };
    const line = JSON.stringify(payload);
    // stdout for all
    if (level === "error" || level === "warn") {
      console.error(line);
    } else {
      console.log(line);
    }
    // optional file sink
    void writeToFile(line);
  }

  return {
    debug: (msg: string, f?: Record<string, unknown>) => log("debug", msg, f),
    info: (msg: string, f?: Record<string, unknown>) => log("info", msg, f),
    warn: (msg: string, f?: Record<string, unknown>) => log("warn", msg, f),
    error: (msg: string, f?: Record<string, unknown>) => log("error", msg, f),
    child(extra: Record<string, unknown>) {
      return createLogger({ ...(context || {}), ...extra });
    },
  };
}


