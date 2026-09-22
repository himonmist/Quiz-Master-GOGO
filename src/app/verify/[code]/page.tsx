import Link from "next/link";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { certificateCode: code },
    include: {
      user: { select: { fullName: true } },
      organization: { select: { name: true } },
      course: { select: { title: true } },
      quiz: { select: { title: true } },
    },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/verify/${code}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 160 });

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card elev-lg" style={{ width: "min(560px, 100%)", padding: "40px 36px", gap: 10, textAlign: "center", alignItems: "center" }}>
        <Link href="/" style={{ fontFamily: "var(--font-heading)", fontSize: 15, letterSpacing: "0.06em", color: "var(--color-accent-700)", textDecoration: "none" }}>
          QUIZ MASTER GOGO
        </Link>

        {certificate ? (
          <>
            <span className="tag tag-accent-2">Certificate Verified</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Certificate QR code" width={140} height={140} style={{ margin: "8px 0" }} />
            <h2 style={{ marginBottom: 2 }}>{certificate.user.fullName}</h2>
            <p className="text-muted" style={{ marginBottom: 18 }}>
              {certificate.quiz?.title ?? certificate.course?.title ?? "Quiz Master GOGO"} · {certificate.organization.name}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", marginBottom: 8 }}>
              <div className="card elev-sm" style={{ padding: 16, alignItems: "center" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{Math.round(certificate.score)}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>Score</div>
              </div>
              <div className="card elev-sm" style={{ padding: 16, alignItems: "center" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{certificate.rank ? `#${certificate.rank}` : "—"}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>Rank</div>
              </div>
            </div>
            <p className="text-muted" style={{ fontSize: 12 }}>
              Issued {certificate.issuedAt.toLocaleDateString()} · Certificate ID {certificate.certificateCode}
            </p>
          </>
        ) : (
          <>
            <span className="tag tag-danger">Not Found</span>
            <h2 style={{ marginBottom: 2 }}>No certificate matches this ID</h2>
            <p className="text-muted">Double check the certificate ID and try again.</p>
          </>
        )}

        <Link href="/verify" className="btn btn-secondary" style={{ marginTop: 12 }}>
          Verify another certificate
        </Link>
      </div>
    </div>
  );
}
