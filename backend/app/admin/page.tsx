import Link from "next/link";
import { listAllPosts } from "@/lib/posts";
import { deletePostAction, logoutAction } from "./actions";
import ConfirmDeleteButton from "./ConfirmDeleteButton";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminDashboard() {
  const posts = listAllPosts();

  return (
    <main className="container">
      <div className="row" style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.7rem", margin: 0 }}>Dashboard</h1>
        <div className="spacer" />
        <Link className="btn" href="/admin/new">
          + New Post
        </Link>
        <form action={logoutAction}>
          <button className="btn secondary" type="submit">
            Log out
          </button>
        </form>
      </div>

      {posts.length === 0 ? (
        <p className="muted">
          No posts yet. <Link href="/admin/new">Write your first one →</Link>
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>
                  <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                </td>
                <td>
                  {post.published ? (
                    <span className="badge published">Published</span>
                  ) : (
                    <span className="badge">Draft</span>
                  )}
                </td>
                <td className="muted">{formatDate(post.created_at)}</td>
                <td>
                  <div className="row" style={{ justifyContent: "flex-end" }}>
                    <Link className="btn secondary" href={`/admin/edit/${post.id}`}>
                      Edit
                    </Link>
                    <form action={deletePostAction}>
                      <input type="hidden" name="id" value={post.id} />
                      <ConfirmDeleteButton />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
