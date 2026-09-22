import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card elev-md" style={{ width: "min(440px, 100%)", padding: "40px 36px", gap: 6 }}>
        <Link
          href="/"
          style={{
            textAlign: "center",
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            letterSpacing: "0.06em",
            color: "var(--color-accent-700)",
            marginBottom: 18,
            textDecoration: "none",
          }}
        >
          QUIZ MASTER GOGO
        </Link>
        <h2 style={{ textAlign: "center", marginBottom: 4 }}>{title}</h2>
        <p className="text-muted" style={{ textAlign: "center", fontSize: 14, marginBottom: 22 }}>
          {subtitle}
        </p>
        {children}
        {footer}
      </div>
    </div>
  );
}
