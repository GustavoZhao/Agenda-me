import { spawnSync } from "node:child_process"
import { config } from "dotenv"
import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL("../", import.meta.url))
const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url))
const envFile = fileURLToPath(new URL("../.env.local", import.meta.url))

const loaded = config({ path: envFile })
if (loaded.error) throw loaded.error

const result = spawnSync(process.execPath, [nextCli, "dev"], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
})

process.exit(result.status ?? 1)
