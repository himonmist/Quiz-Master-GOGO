import { requireUser, ADMIN_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminAuditLogsPage() {
  const user = await requireUser(ADMIN_ROLES);
  const organizationId = user.organizationId;

  const logs = organizationId
    ? await prisma.auditLog.findMany({
        where: { organizationId },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Audit Logs</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Every important action, recorded for review.</p>

      <div className="card elev-sm" style={{ padding: "8px 16px" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>By</th>
              <th>Entity</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>
                  <span className="tag tag-neutral">{l.action}</span>
                </td>
                <td className="text-muted">{l.user?.fullName ?? "System"}</td>
                <td className="text-muted">
                  {l.entityType ? `${l.entityType} · ${l.entityId?.slice(0, 8)}…` : "—"}
                </td>
                <td className="text-muted">{l.createdAt.toLocaleString()}</td>
              </tr>
            ))}
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No audit events yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
