import PostForm from "../PostForm";
import { createPostAction } from "../actions";

export default function NewPostPage() {
  return (
    <main className="container">
      <h1 style={{ fontSize: "1.7rem" }}>New Post</h1>
      <PostForm action={createPostAction} submitLabel="Create post" />
    </main>
  );
}
