import Link from "next/link";
import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "My Courses" },
  { href: "/history", label: "Quiz History" },
  { href: "/certificates", label: "Certificates" },
  { href: "/profile", label: "Profile" },
];

export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isStaff = STAFF_ROLES.includes(user.role);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 230,
          flex: "none",
          background: "var(--color-surface)",
          padding: "24px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Link href="/dashboard" style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: "var(--color-accent-700)", marginBottom: 20, textDecoration: "none" }}>
          GOGO
        </Link>
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} style={{ padding: "10px 14px", fontSize: 14, textDecoration: "none", color: "var(--color-text)", borderRadius: 999 }}>
            {item.label}
          </Link>
        ))}
        <div style={{ flex: 1 }} />
        {isStaff ? (
          <Link href="/admin" className="btn btn-ghost" style={{ fontSize: 13, justifyContent: "flex-start" }}>
            Admin view →
          </Link>
        ) : null}
        <LogoutButton className="btn btn-ghost" style={{ fontSize: 13, justifyContent: "flex-start", opacity: 0.7 }} />
      </aside>
      <div style={{ flex: 1, padding: "32px 40px", maxWidth: 1200 }}>{children}</div>
    </div>
  );
}
