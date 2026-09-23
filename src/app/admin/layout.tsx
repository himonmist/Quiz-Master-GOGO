import Link from "next/link";
import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/quizzes", label: "Quizzes" },
  { href: "/admin/questions", label: "Question Bank" },
  { href: "/admin/participants", label: "Participants & Live Monitor" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(STAFF_ROLES);
  const nav = user.role === "SUPER_ADMIN" ? [...NAV, { href: "/admin/organizations", label: "Organizations" }] : NAV;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 240,
          flex: "none",
          background: "var(--color-neutral-900)",
          color: "var(--color-bg)",
          padding: "24px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, marginBottom: 20 }}>GOGO ADMIN</div>
        {nav.map((item) => (
          <Link key={item.href} href={item.href} style={{ padding: "10px 14px", fontSize: 14, textDecoration: "none", color: "var(--color-bg)", opacity: 0.85, borderRadius: 999 }}>
            {item.label}
          </Link>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 14px", fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
          {user.fullName} · {user.role.replace("_", " ")}
        </div>
        <Link href="/dashboard" className="btn btn-ghost" style={{ fontSize: 13, justifyContent: "flex-start", color: "var(--color-accent-300)" }}>
          ← Exit admin view
        </Link>
        <LogoutButton className="btn btn-ghost" style={{ fontSize: 13, justifyContent: "flex-start", color: "var(--color-bg)", opacity: 0.7 }} />
      </aside>
      <div style={{ flex: 1, padding: "32px 40px", maxWidth: 1300 }}>{children}</div>
    </div>
  );
}
