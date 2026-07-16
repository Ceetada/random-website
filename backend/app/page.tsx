import Link from "next/link";
import { listPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function HomePage() {
  const posts = listPublishedPosts();

  return (
    <main className="container">
      <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>My Blog</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Thoughts, notes, and whatever else I feel like posting.
      </p>

      {posts.length === 0 ? (
        <p className="muted" style={{ marginTop: "2rem" }}>
          No posts yet. If this is your blog,{" "}
          <Link href="/login">log in</Link> to write your first one.
        </p>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.id}>
              <h2>
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              </h2>
              <span className="date">{formatDate(post.created_at)}</span>
              {post.excerpt ? (
                <p className="excerpt">{post.excerpt}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
