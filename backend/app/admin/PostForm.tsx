"use client";

import { useState } from "react";
import Link from "next/link";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

export interface PostFormValues {
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
}

export default function PostForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: PostFormValues;
  submitLabel: string;
}) {
  const [content, setContent] = useState(initial?.content ?? "");

  // Preview is rendered client-side for the author's own draft. The published
  // page re-renders and sanitizes server-side (see lib/markdown.ts).
  const previewHtml = content.trim()
    ? (marked.parse(content, { async: false }) as string)
    : "";

  return (
    <form action={action}>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initial?.title ?? ""}
          placeholder="A great title"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="excerpt">Excerpt (optional, shown on the homepage)</label>
        <input
          id="excerpt"
          name="excerpt"
          type="text"
          defaultValue={initial?.excerpt ?? ""}
          placeholder="A one-line summary"
        />
      </div>

      <div className="field">
        <label>Content (Markdown)</label>
        <div className="editor-grid">
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"# Hello world\n\nWrite your post in **Markdown** here."}
          />
          <div
            className="preview article"
            aria-label="Live preview"
          >
            {previewHtml ? (
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <p className="empty">Live preview appears here…</p>
            )}
          </div>
        </div>
      </div>

      <div className="field checkbox">
        <input
          id="published"
          name="published"
          type="checkbox"
          defaultChecked={initial?.published ?? false}
        />
        <label htmlFor="published">
          Publish now (leave unchecked to save as a draft)
        </label>
      </div>

      <div className="row">
        <button className="btn" type="submit">
          {submitLabel}
        </button>
        <Link className="btn secondary" href="/admin">
          Cancel
        </Link>
      </div>
    </form>
  );
}
