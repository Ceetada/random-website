import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { isLoggedIn } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Blog",
  description: "A blog I can post to whenever I want.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loggedIn = await isLoggedIn();
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="inner">
            <Link href="/" className="brand">
              My Blog
            </Link>
            <nav>
              <Link href="/">Home</Link>
              {loggedIn ? (
                <Link href="/admin">Dashboard</Link>
              ) : (
                <Link href="/login">Log in</Link>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
