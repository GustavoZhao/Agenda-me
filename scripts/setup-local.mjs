import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL("../", import.meta.url))
const prismaCli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url))
const seedScript = fileURLToPath(new URL("./seed-local.mjs", import.meta.url))

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  })

  if (result.status !== 0) process.exit(result.status ?? 1)
}

run([prismaCli, "db", "push"])
run([seedScript])
