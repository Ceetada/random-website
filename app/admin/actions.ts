"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, destroySession } from "@/lib/auth";
import {
  createPost,
  updatePost,
  deletePost,
  type PostInput,
} from "@/lib/posts";

async function requireAuth(): Promise<void> {
  if (!(await getSession())) {
    redirect("/login");
  }
}

function readForm(formData: FormData): PostInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    content: String(formData.get("content") ?? ""),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    published: formData.get("published") === "on",
  };
}

export async function createPostAction(formData: FormData): Promise<void> {
  await requireAuth();
  const input = readForm(formData);
  if (!input.title) return; // the form enforces this client-side too
  const post = createPost(input);
  revalidatePath("/");
  redirect(`/posts/${post.slug}`);
}

export async function updatePostAction(
  id: number,
  formData: FormData
): Promise<void> {
  await requireAuth();
  const input = readForm(formData);
  if (!input.title) return;
  const post = updatePost(id, input);
  revalidatePath("/");
  if (post) revalidatePath(`/posts/${post.slug}`);
  redirect(post ? `/posts/${post.slug}` : "/admin");
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (Number.isFinite(id)) {
    deletePost(id);
    revalidatePath("/");
  }
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
