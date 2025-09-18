## Quick Setup (Fresh Machine / CI / Prod)

Use this short guide to get the project running and keep per-bot size small. It assumes a single shared `containers/mainCodebase/node_modules` and thin per-bot folders.

### 1) Install dependencies once (shared)

```bash
# Windows PowerShell
cd containers/mainCodebase
npm ci --omit=dev
```

```bash
# Linux/macOS
cd containers/mainCodebase
npm ci --omit=dev
```

### 2) Create per-bot node_modules links (share deps)

All containers under `backend/containers/<containerId>` link their `node_modules` to the shared one.

Windows (Command Prompt):
```bat
cd /d %CD%\backend\containers
for /d %D in (*) do if exist "%D\node_modules" rmdir /s /q "%D\node_modules" & mklink /J "%D\node_modules" "..\..\containers\mainCodebase\node_modules"
```

Linux/macOS:
```bash
cd backend/containers
for d in */ ; do
  rm -rf "$d/node_modules"
  ln -s ../../containers/mainCodebase/node_modules "$d/node_modules"
done
```

Notes:
- Links are not stored in git; rerun this step on fresh clones or CI.
- You can re-run safely; it recreates links.

### 3) Environment and keys

Set required env vars (examples):

```bash
# Port allocation (optional)
set AI_CONTAINER_BASE_PORT=3001            # Windows
export AI_CONTAINER_BASE_PORT=3001         # Linux/macOS

# Google APIs (required for web search/LLM)
set GOOGLE_AI_API_KEY=<gemini_key>
set GOOGLE_CSE_API_KEY=<google_cse_key>
set GOOGLE_CSE_CX=<google_cse_cx>
```

### 4) Start backend

```bash
# From repo root
node backend/server.js
```

### 5) Create a bot (demo mode OK without Docker)

```bash
# Example
node cli/createContainer.js sess_123 "Customer Bot" "Helpful customer support assistant"
```

### Production recommendations

- Prefer a single Docker image with deps installed; mount per-bot data dirs (`rag_db/`, `doc_store.json`, `ai-config.js`).
- Avoid copying `node_modules` into each bot; rely on shared deps or image layers.
- Provide a one-time init step (this document’s link recreation) in CI/CD.

### Troubleshooting

- If a bot cannot `require` modules: recreate the links (Step 2).
- If size is large per bot: ensure links exist and no duplicated `node_modules` remain in bot folders.
- If citations appear in normal answers: config is set to explicit-only; verify bot uses latest `containers/mainCodebase/botLogic.js`.
