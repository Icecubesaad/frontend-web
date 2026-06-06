# HTML-CSS-JS Clone (static)

A pure static (no build, no framework) clone of `repo-for-testing/full-stack-app`'s Next.js frontend.
Same warm editorial UI — cream canvas, coral accents, serif display type — but rendered as a single
HTML file plus two CSS/JS files. Designed to be served from S3+CloudFront, GitHub Pages, or any
static host.

## Files

| File        | Purpose                                                       |
|-------------|---------------------------------------------------------------|
| `index.html`| Single-page app shell                                         |
| `style.css` | All styles (mirrors the original Tailwind theme)              |
| `config.js` | Editable `window.APP_CONFIG` — set `apiUrl` to your backend   |
| `script.js` | Chat logic; calls `POST {apiUrl}/chat` (non-streaming)        |

## Run locally

Just open `index.html` in a browser. Then point `config.js > apiUrl` at a running backend.

For the matching backend in this repo, use the **express-clone**:

```bash
cd ../express-clone
npm install
echo "OPENROUTER_API_KEY=sk-or-..." > .env
npm start
```

Then edit `config.js`:

```js
window.APP_CONFIG = { apiUrl: "http://localhost:8000", ... };
```

Open `index.html` in your browser.

## API contract assumed

The frontend calls these endpoints (matching the original FastAPI and the express-clone):

| Method | Path                  | Body / Response                                  |
|--------|-----------------------|--------------------------------------------------|
| GET    | `/conversations`      | → `[{id, title, model, ...}]`                    |
| GET    | `/conversations/{id}` | → `{id, title, messages: [{role, content}, ...]}`|
| DELETE | `/conversations/{id}` | → `{ok: true}`                                   |
| POST   | `/chat`               | body `{message, model, conversation_id?}` → `{response, conversation_id}` |

If your backend does not implement `/conversations*` (the express-clone doesn't), the UI silently
falls back to local-only state — it still works for single-session testing.

## Deploying as a static site

Drop the four files in any S3 bucket with public read + `index.html` as the error document, or
push to a CloudFront distribution. The devops-ai-agent's `static_site` deployment type will pick
this up unchanged.
