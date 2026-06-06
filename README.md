# HTML-CSS-JS Clone (static, request-response only)

A pure static (no build, no framework) clone of `repo-for-testing/full-stack-app`'s Next.js frontend.
Same warm editorial UI — cream canvas, coral accents, serif display type — but rendered as a single
HTML file plus two CSS/JS files. Designed to be served from S3+CloudFront, GitHub Pages, or any
static host, and to talk to the **FastAPI backend at `repo-for-testing/full-stack-app/backend/`**
via plain `fetch()` calls. No WebSocket, no SSE streaming — the backend was edited to drop `/chat/stream`.

## Files

| File        | Purpose                                                                  |
|-------------|--------------------------------------------------------------------------|
| `index.html`| Single-page app shell                                                    |
| `style.css` | All styles (mirrors the original Tailwind theme)                         |
| `config.js` | Editable `window.APP_CONFIG` — `apiUrl`, endpoints                       |
| `script.js` | Chat logic; calls `POST {apiUrl}/chat` (non-streaming)                   |
| `README.md` | This file                                                                |

## API contract (matches the FastAPI backend)

The frontend calls these endpoints, all defined in `repo-for-testing/full-stack-app/backend/main.py`:

| Method | Path                              | Body                                          | Response                                    |
|--------|-----------------------------------|-----------------------------------------------|---------------------------------------------|
| GET    | `/health`                         | —                                             | `{status: "ok"}`                            |
| GET    | `/conversations`                  | —                                             | `[{id, title, model, created_at, updated_at}]` |
| GET    | `/conversations/{id}`             | —                                             | `{id, title, ..., messages: [{role, content}]}` |
| PATCH  | `/conversations/{id}`             | `{title?, model?}`                            | updated conversation                        |
| DELETE | `/conversations/{id}`             | —                                             | `{ok: true}`                                |
| POST   | `/conversations/{id}/messages`    | `{role, content}`                             | created message                             |
| POST   | `/chat`                           | `{message, model?, conversation_id?}`          | `{conversation_id, response}`               |

## Run locally (against the FastAPI backend)

```bash
# Terminal 1: backend
cd repo-for-testing/full-stack-app/backend
pip install -r requirements.txt
export OPENROUTER_API_KEY=sk-or-...   # Windows:  set OPENROUTER_API_KEY=sk-or-...
uvicorn main:app --reload --port 8000
```

```bash
# Terminal 2: serve the static frontend on port 3000
# (port 3000 is the backend's default CORS_ORIGINS = FRONTEND_URL,
#  so requests from the static site will be allowed)
cd repo-for-testing/html-css-js-clone/..
python -m http.server 3000
```

Open <http://localhost:3000/html-css-js-clone/> in your browser.

> **CORS:** the backend's default `CORS_ORIGINS` is `http://localhost:3000`. If you serve the
> frontend from a different port or domain, set the `CORS_ORIGINS` env var on the backend, e.g.
> `CORS_ORIGINS=http://localhost:8080,https://my-site.example.com`.

## Point at a different backend

Three options, in order of preference:

1. **URL query param (no rebuild):**
   ```
   http://localhost:3000/?api=https://api.staging.example.com
   ```
2. **Edit `config.js`:**
   ```js
   window.APP_CONFIG = { apiUrl: "https://api.staging.example.com", ... };
   ```
3. **Edit `config.js` and ship:** the static files are pure HTML/CSS/JS — no build step. Upload
   the four files to S3, GitHub Pages, or any static host.

## Deploying the full stack via devops-ai-agent

The devops-ai-agent's `static_site` deployment type serves this folder as-is. The matching
`ecs_app` type deploys the FastAPI backend. The only env-var coupling is `apiUrl` (frontend
config) ↔ `CORS_ORIGINS` (backend env var). Both must agree on the origin the browser sees.

Suggested env-var matrix:

| Backend env       | Value (example)              | Why                                          |
|-------------------|------------------------------|----------------------------------------------|
| `OPENROUTER_API_KEY` | `sk-or-...`               | Real AI replies (else the `/chat` endpoint 500s) |
| `FRONTEND_URL`    | `https://chat.example.com`   | Used as the default `CORS_ORIGINS`            |
| `CORS_ORIGINS`    | `https://chat.example.com,https://chat-staging.example.com` | Allow multiple origins     |

| Frontend `config.js` | Value (example)              | Why                                          |
|----------------------|------------------------------|----------------------------------------------|
| `apiUrl`             | `https://api.example.com`    | Where the FastAPI backend is reachable       |
