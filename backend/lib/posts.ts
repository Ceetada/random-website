import { db } from "./db";

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  published: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface PostInput {
  title: string;
  content: string;
  excerpt?: string;
  published: boolean;
}

/** Turn a title into a URL-safe slug, e.g. "My First Post!" -> "my-first-post". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Ensure the slug is unique, appending -2, -3, ... if needed. */
function uniqueSlug(base: string, ignoreId?: number): string {
  const fallback = base || "post";
  let candidate = fallback;
  let n = 1;
  const stmt = db.prepare(
    "SELECT id FROM posts WHERE slug = ? AND id IS NOT ?"
  );
  // `id IS NOT ?` treats NULL specially, so pass a value that never matches.
  const ignore = ignoreId ?? -1;
  while (stmt.get(candidate, ignore)) {
    n += 1;
    candidate = `${fallback}-${n}`;
  }
  return candidate;
}

export function listPublishedPosts(): Post[] {
  return db
    .prepare(
      "SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC"
    )
    .all() as Post[];
}

export function listAllPosts(): Post[] {
  return db
    .prepare("SELECT * FROM posts ORDER BY created_at DESC")
    .all() as Post[];
}

export function getPostBySlug(slug: string): Post | undefined {
  return db.prepare("SELECT * FROM posts WHERE slug = ?").get(slug) as
    | Post
    | undefined;
}

export function getPostById(id: number): Post | undefined {
  return db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as
    | Post
    | undefined;
}

export function createPost(input: PostInput): Post {
  const now = new Date().toISOString();
  const slug = uniqueSlug(slugify(input.title));
  const result = db
    .prepare(
      `INSERT INTO posts (title, slug, content, excerpt, published, created_at, updated_at)
       VALUES (@title, @slug, @content, @excerpt, @published, @created_at, @updated_at)`
    )
    .run({
      title: input.title,
      slug,
      content: input.content,
      excerpt: input.excerpt ?? "",
      published: input.published ? 1 : 0,
      created_at: now,
      updated_at: now,
    });
  return getPostById(Number(result.lastInsertRowid))!;
}

export function updatePost(id: number, input: PostInput): Post | undefined {
  const existing = getPostById(id);
  if (!existing) return undefined;

  // Regenerate the slug from the (possibly new) title, keeping it unique.
  const slug = uniqueSlug(slugify(input.title), id);
  db.prepare(
    `UPDATE posts
       SET title = @title, slug = @slug, content = @content, excerpt = @excerpt,
           published = @published, updated_at = @updated_at
     WHERE id = @id`
  ).run({
    id,
    title: input.title,
    slug,
    content: input.content,
    excerpt: input.excerpt ?? "",
    published: input.published ? 1 : 0,
    updated_at: new Date().toISOString(),
  });
  return getPostById(id);
}

export function deletePost(id: number): void {
  db.prepare("DELETE FROM posts WHERE id = ?").run(id);
}
