"use client";

export default function ConfirmDeleteButton() {
  return (
    <button
      className="btn danger"
      type="submit"
      onClick={(e) => {
        if (!confirm("Delete this post? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      Delete
    </button>
  );
}
