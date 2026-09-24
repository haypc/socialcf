# SocialCF

SocialCF — starter full-stack social platform: Instagram-style posts plus Telegram-style real-time chats.

## Stack

- **Frontend:** React + Vite + TypeScript + TailwindCSS, static GitHub Pages deployment.
- **Backend:** Cloudflare Workers + Hono + D1 + R2 + Durable Objects + Workers AI.
- **Auth:** email/password, PBKDF2 via Web Crypto API, signed HS256 JWT.

## Repository

```text
socialcf/
├── frontend/                         # React + Vite + TypeScript + Tailwind
│   ├── src/{pages,components,api,ws,store}
│   ├── vite.config.ts                # base: '/socialcf/'
│   └── package.json
├── backend/                          # Cloudflare Worker + Hono
│   ├── src/{index.ts,routes,durable,middleware,db,lib}
│   ├── wrangler.toml
│   └── package.json
├── migrations/0001_init.sql
├── .github/workflows/{deploy-frontend.yml,deploy-backend.yml}
└── README.md
```

## 1. Create Cloudflare resources

```bash
cd backend
npm install
npx wrangler login
npx wrangler d1 create socialcf-db
npx wrangler r2 bucket create socialcf-media
```

Copy the returned D1 `database_id` into `backend/wrangler.toml`. The deployed configuration uses `https://haypc.github.io` and the connected Cloudflare account ID. If you fork the project, replace the GitHub username and account ID. R2 must be enabled once in the Cloudflare Dashboard before the bucket can be created. If your GitHub Pages project URL is `https://myname.github.io/socialcf/`, the allowed origin is `https://myname.github.io` (without `/socialcf/`).

Apply the schema:

```bash
npx wrangler d1 migrations apply socialcf-db --remote
```

Set Worker secrets. R2 S3 API credentials are needed for browser-to-R2 presigned PUT uploads:

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

Create an R2 API token in Cloudflare with Object Read & Write for `socialcf-media`. For local development, use `npx wrangler secret put ... --local` or a `.dev.vars` file (never commit it):

```text
JWT_SECRET=replace-with-a-long-random-secret
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

Configure R2 CORS for your GitHub Pages origin so the signed PUT works. Example JSON for an R2 CORS rule:

```json
[{"AllowedOrigins":["https://<username>.github.io"],"AllowedMethods":["PUT","GET"],"AllowedHeaders":["Content-Type"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3600}]
```

## 2. GitHub setup

1. Create a repository named `socialcf` and copy this folder into it.
2. In GitHub **Settings → Pages**, choose **GitHub Actions** as the source.
3. Add repository secret `VITE_API_URL` with the deployed Worker URL, e.g. `https://socialcf-api.<subdomain>.workers.dev`.
4. Add repository secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `JWT_SECRET`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`. The backend workflow copies these into Cloudflare Worker secrets.
5. Push to `main`. The frontend workflow publishes `frontend/dist` (including the SPA fallback `404.html`) to `https://<username>.github.io/socialcf/`.

The Cloudflare token used by GitHub should be scoped to the account with Workers Scripts edit and D1/R2 permissions required by your deployment. Keep `JWT_SECRET` and R2 credentials as Cloudflare Worker secrets, not Vite variables.

## 3. Local development

Create `frontend/.env.local`:

```text
VITE_API_URL=http://localhost:8787
```

Run the backend and frontend in separate terminals:

```bash
cd backend && npm install && npx wrangler dev
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173/socialcf/`.

## 4. Deploy backend manually

```bash
cd backend
npx wrangler deploy
```

The backend endpoints include:

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/me`
- `GET /api/feed?cursor=`, `POST /api/posts`, `GET /api/posts/:id`
- `POST /api/posts/:id/like`, `GET/POST /api/posts/:id/comments`
- `POST /api/upload/presign`
- `GET /api/users/:username`, `POST /api/follows/:userId`
- `GET /api/chats`, `POST /api/chats`, `GET /api/chat/:chatId/messages`
- `GET /api/chat/:chatId/ws` for WebSocket messages

## 5. Production notes

- Free-plan quotas and availability of D1, R2, Durable Objects and Workers AI can change; verify the current Cloudflare limits before launch.
- The included rate limiter is isolate-local best effort. For a high-traffic production service, replace it with a Cloudflare Rate Limiting binding or a durable counter.
- WebSocket clients authenticate with a short-lived JWT query parameter because browsers cannot attach arbitrary headers to the WebSocket constructor. Use HTTPS/WSS in production.
- The R2 media proxy is public by key. For private media, replace it with authenticated signed GET URLs.
- Add email verification, password reset, abuse reporting, pagination for comments, image processing, and stronger moderation policies before a public launch.
