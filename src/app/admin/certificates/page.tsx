import Link from "next/link";
import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminCertificatesPage() {
  const user = await requireUser(STAFF_ROLES);
  const organizationId = user.organizationId;

  const certificates = organizationId
    ? await prisma.certificate.findMany({
        where: { organizationId },
        include: { user: { select: { fullName: true, email: true } }, quiz: { select: { title: true } } },
        orderBy: { issuedAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Certificates</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Issued automatically when a participant passes a quiz.</p>

      <div className="card elev-sm" style={{ padding: "8px 16px" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Certificate ID</th>
              <th>Participant</th>
              <th>Quiz</th>
              <th>Score</th>
              <th>Rank</th>
              <th>Issued</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((c) => (
              <tr key={c.id}>
                <td>{c.certificateCode}</td>
                <td>{c.user.fullName}</td>
                <td className="text-muted">{c.quiz?.title ?? "—"}</td>
                <td>{Math.round(c.score)}</td>
                <td>{c.rank ? `#${c.rank}` : "—"}</td>
                <td className="text-muted">{c.issuedAt.toLocaleDateString()}</td>
                <td>
                  <Link href={`/verify/${c.certificateCode}`} className="btn btn-ghost btn-sm">
                    Verify →
                  </Link>
                </td>
              </tr>
            ))}
            {certificates.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted">
                  No certificates issued yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
