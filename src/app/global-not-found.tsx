// Rendered when a request matches no route at all (outside any locale segment).
// next.config.ts opts in via experimental.globalNotFound = true.
import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="uk">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <p style={{ fontSize: "4rem", fontWeight: "bold", opacity: 0.2 }}>404</p>
          <h1 style={{ fontSize: "1.5rem" }}>Page not found</h1>
          <Link href="/" style={{ textDecoration: "underline" }}>
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
