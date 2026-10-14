/**
 * Copies the Next.js static export (dist/) into release/.
 *
 * Why: the app-publishing uploader excludes build-output folders (dist/,
 * .next/, out/ …) from the uploaded source. The deployed static server
 * (server.js) serves from release/ so the built site ships with the upload.
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "dist");
const dest = path.join(__dirname, "..", "release");

if (!fs.existsSync(src)) {
  console.error("[pack] dist/ not found — run `next build` first.");
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log("[pack] dist/ -> release/ synced.");
