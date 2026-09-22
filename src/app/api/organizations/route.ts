import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint: only exposes id/name so the registration form can offer
// an organization picker without leaking tenant details.
export async function GET() {
  const organizations = await prisma.organization.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ organizations });
}
