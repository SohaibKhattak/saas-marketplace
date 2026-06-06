// apps/api/src/routes/internal.routes.ts
import { Router } from "express";
import { execFile } from "child_process";
import util from "util";
import { env } from "../config/env"; // Adjust path to your env file

const execFileAsync = util.promisify(execFile);
const router = Router();

router.post("/wp-cli-bridge", async (req, res) => {
  const incomingSecret = req.headers["x-internal-secret"];

  // 1. Guard the route securely
  if (!incomingSecret || incomingSecret !== env.INTERNAL_WP_SECRET) {
    return res.status(401).json({ error: "Unauthorized internal bridge request." });
  }

  const { args } = req.body; // Expects an array of arguments like ["site", "create", ...]

  try {
    // 2. Execute directly on the Linux VM hosting WordPress
    const { stdout } = await execFileAsync(
      "sudo",
      ["-u", "www-data", env.WP_CLI_PATH, ...args, `--path=/var/www/wordpress`],
      { timeout: 30000 }
    );
    return res.json({ output: stdout.trim() });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;