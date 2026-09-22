import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function CertificatesPage() {
  const user = await requireUser();

  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    include: { quiz: { select: { title: true } }, course: { select: { title: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Certificates</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Earned by passing a quiz or competition.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {certificates.map((c) => (
          <div key={c.id} className="card elev-md" style={{ padding: 22, gap: 8 }}>
            <div className="card-kicker">{c.course?.title ?? "Competition"}</div>
            <div className="card-title">{c.quiz?.title ?? "Quiz Master GOGO"}</div>
            <p className="card-body">
              Score {Math.round(c.score)} {c.rank ? `· Rank #${c.rank}` : ""} · {c.issuedAt.toLocaleDateString()}
            </p>
            <div className="card-meta">{c.certificateCode}</div>
            <Link href={`/verify/${c.certificateCode}`} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>
              View & verify →
            </Link>
          </div>
        ))}
        {certificates.length === 0 ? <p className="text-muted">No certificates yet — pass a quiz to earn one.</p> : null}
      </div>
    </div>
  );
}
