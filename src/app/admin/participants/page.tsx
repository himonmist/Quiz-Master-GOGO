import { requireUser, STAFF_ROLES, ADMIN_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserActiveToggle } from "@/components/admin/UserActiveToggle";

export default async function AdminParticipantsPage() {
  const user = await requireUser(STAFF_ROLES);
  const organizationId = user.organizationId;
  const canSuspend = ADMIN_ROLES.includes(user.role);

  const [participants, suspicious] = organizationId
    ? await Promise.all([
        prisma.user.findMany({
          where: { organizationId, role: "PARTICIPANT" },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.suspiciousEvent.findMany({
          where: { attempt: { quiz: { organizationId } } },
          include: { user: { select: { fullName: true } }, attempt: { include: { quiz: { select: { title: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 15,
        }),
      ])
    : [[], []];

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Participants</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Manage accounts and review flagged activity.</p>

      <div className="card elev-sm" style={{ padding: "8px 16px", marginBottom: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Joined</th>
              {canSuspend ? <th></th> : null}
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id}>
                <td>{p.fullName}</td>
                <td className="text-muted">{p.email}</td>
                <td>
                  <span className={p.isActive ? "tag tag-accent-2" : "tag tag-danger"}>{p.isActive ? "Active" : "Suspended"}</span>
                </td>
                <td className="text-muted">{p.createdAt.toLocaleDateString()}</td>
                {canSuspend ? (
                  <td>
                    <UserActiveToggle userId={p.id} isActive={p.isActive} />
                  </td>
                ) : null}
              </tr>
            ))}
            {participants.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No participants yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: 10 }}>Suspicious activity</h3>
      <div className="card elev-sm" style={{ padding: "8px 16px" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Quiz</th>
              <th>Event</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {suspicious.map((s) => (
              <tr key={s.id}>
                <td>{s.user.fullName}</td>
                <td className="text-muted">{s.attempt.quiz.title}</td>
                <td>
                  <span className="tag tag-outline">{s.type.replace("_", " ")}</span>
                </td>
                <td className="text-muted">{s.createdAt.toLocaleString()}</td>
              </tr>
            ))}
            {suspicious.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No flagged events.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
