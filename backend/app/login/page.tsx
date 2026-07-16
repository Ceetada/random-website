"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <main className="container" style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: "1.6rem" }}>Log in</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Sign in to write and manage posts.
      </p>

      <form action={formAction}>
        {state?.error ? <div className="error">{state.error}</div> : null}

        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" autoComplete="username" required />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
