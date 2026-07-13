import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { isLoggedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  // Drafts (published = 0) are only visible to a logged-in admin.
  if (!post || (!post.published && !(await isLoggedIn()))) {
    notFound();
  }

  const html = renderMarkdown(post.content);

  return (
    <main className="container">
      <p style={{ marginTop: 0 }}>
        <Link href="/">← Back to all posts</Link>
      </p>
      <article className="article">
        {!post.published ? (
          <span className="badge" style={{ marginBottom: "1rem", display: "inline-block" }}>
            Draft — only you can see this
          </span>
        ) : null}
        <h1>{post.title}</h1>
        <span className="date">{formatDate(post.created_at)}</span>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </main>
  );
}
