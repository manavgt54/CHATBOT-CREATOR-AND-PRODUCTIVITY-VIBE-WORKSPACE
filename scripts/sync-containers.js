const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'containers', 'mainCodebase');
const dstRoot = path.join(repoRoot, 'backend', 'containers');
const files = ['botLogic.js', 'rag.js', 'config.js'];

function copyIfExists(src, dst) {
  try {
    fs.copyFileSync(src, dst);
    return true;
  } catch (e) {
    return false;
  }
}

function run() {
  const entries = fs.readdirSync(dstRoot, { withFileTypes: true }).filter(e => e.isDirectory());
  const results = [];
  for (const e of entries) {
    const cdir = path.join(dstRoot, e.name);
    const res = { id: e.name, updated: [] };
    for (const f of files) {
      const ok = copyIfExists(path.join(srcDir, f), path.join(cdir, f));
      if (ok) res.updated.push(f);
    }
    results.push(res);
  }
  console.log(JSON.stringify({ updated: results }, null, 2));
}

run();









