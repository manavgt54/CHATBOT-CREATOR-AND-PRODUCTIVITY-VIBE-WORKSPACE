const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDE = [/\\node_modules\\|\/node_modules\//, /\\rag_db\\|\/rag_db\//, /\\dist\\|\/dist\//, /\\build\\|\/build\//];
const EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);

function shouldExclude(p) {
  const norm = p.replace(/\\/g, '/');
  return EXCLUDE.some((re) => re.test(norm));
}

function sumDir(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (shouldExclude(full)) continue;
    if (e.isDirectory()) {
      total += sumDir(full);
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (EXT.has(ext)) {
        try { total += fs.statSync(full).size; } catch (_) {}
      }
    }
  }
  return total;
}

function mb(bytes) { return Math.round((bytes / (1024 * 1024)) * 1000) / 1000; }

const all = sumDir(ROOT);
const backend = sumDir(path.join(ROOT, 'backend'));
const containers = sumDir(path.join(ROOT, 'containers', 'mainCodebase'));
const frontend = sumDir(path.join(ROOT, 'frontend', 'src'));

console.log(JSON.stringify({
  root: ROOT,
  totals: { bytes: all, mb: mb(all) },
  backend: { bytes: backend, mb: mb(backend) },
  containers_mainCodebase: { bytes: containers, mb: mb(containers) },
  frontend_src: { bytes: frontend, mb: mb(frontend) }
}, null, 2));









