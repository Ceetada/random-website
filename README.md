# My Blog

A small blog you can post to whenever you want. Log in, click **New Post**,
write in Markdown, and hit **Publish** — the post appears on the site instantly.
Save posts as drafts and publish them later.

Built with **Next.js (App Router) + TypeScript + SQLite**.

## Features

- Public blog: homepage list of posts + individual post pages
- Password-protected admin dashboard at `/admin`
- Create / edit / delete posts
- Markdown editor with a live preview
- Draft vs. published state (drafts are only visible to you)
- No external services required — posts live in a local SQLite file

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and set:

   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` — your login
   - `SESSION_SECRET` — a long random string (`openssl rand -hex 32`)

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open <http://localhost:3000>. Go to `/login`, sign in, and start writing.

## How it works

| Path                  | What it is                                    |
| --------------------- | --------------------------------------------- |
| `/`                   | Public homepage listing published posts       |
| `/posts/[slug]`       | A single published post                       |
| `/login`              | Admin login                                   |
| `/admin`              | Dashboard: list, edit, delete, publish        |
| `/admin/new`          | Write a new post                              |
| `/admin/edit/[id]`    | Edit an existing post                         |

Data is stored in `data/blog.db` (a SQLite file, git-ignored). The database and
its table are created automatically on first run.

## Deploying

This app needs a Node.js server and a place to keep the SQLite file, so it runs
well on hosts with a persistent disk (e.g. a small VPS, Railway, Render, or
Fly.io). Set the same environment variables from `.env.example` in your host's
dashboard.

> Note: platforms with an ephemeral/read-only filesystem (like Vercel's default
> serverless functions) won't persist the SQLite file between deploys. For those,
> point `DATABASE_PATH` at a mounted volume or switch to a hosted database.

## Security notes

- Login uses a single admin account defined by environment variables.
- The session cookie is `httpOnly` and signed with `SESSION_SECRET`.
- Rendered post HTML is sanitized server-side, so Markdown can't inject scripts.
- Always change `ADMIN_PASSWORD` and `SESSION_SECRET` before going live.
