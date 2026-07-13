import { notFound } from "next/navigation";
import PostForm from "../../PostForm";
import { updatePostAction } from "../../actions";
import { getPostById } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  const post = Number.isFinite(postId) ? getPostById(postId) : undefined;
  if (!post) notFound();

  // Bind the post id into the update action.
  const action = updatePostAction.bind(null, post.id);

  return (
    <main className="container">
      <h1 style={{ fontSize: "1.7rem" }}>Edit Post</h1>
      <PostForm
        action={action}
        submitLabel="Save changes"
        initial={{
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          published: post.published === 1,
        }}
      />
    </main>
  );
}
