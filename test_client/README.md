# Mini Chatbot Test Client

A tiny Node client to verify your per-AI public API key works with persona and RAG.

## Prereqs
- Node 18+
- Your API key from the AI chat window
- Your backend URL (local http://localhost:5000 or deployed domain)

## Install
```
cd test_client
npm install
```

## Run
- Seed some memory, then test recalls:
```
AI_API_KEY=YOUR_KEY API_BASE_URL=http://localhost:5000 npm run seed
```

- Just run basic tests without seeding:
```
AI_API_KEY=YOUR_KEY API_BASE_URL=http://localhost:5000 npm start
```

Outputs three lines showing persona adherence and two RAG recalls.

## Notes
- Keep your API key secret (use env vars).
- To use from anywhere, set API_BASE_URL to your deployed backend URL.
