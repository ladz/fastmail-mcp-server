#!/usr/bin/env node
const { execSync, spawn } = require("child_process");

// Check if bun is available
try {
  execSync("bun --version", { stdio: "ignore" });
} catch {
  console.error("Error: Bun runtime is required but not found.");
  console.error("Install it with: curl -fsSL https://bun.sh/install | bash");
  process.exit(1);
}

// Run the actual server with bun
const serverPath = require("path").join(__dirname, "..", "src", "index.ts");
const child = spawn("bun", ["run", serverPath], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code || 0));
