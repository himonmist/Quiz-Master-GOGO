import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EditProfileForm, ChangePasswordForm } from "@/components/ProfileForms";

export default async function ProfilePage() {
  const user = await requireUser();
  const organization = user.organizationId
    ? await prisma.organization.findUnique({ where: { id: user.organizationId }, select: { name: true } })
    : null;

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Profile</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>
        {user.email} · {organization?.name ?? "No organization"} · {user.role.replace("_", " ")}
      </p>
      <div style={{ display: "grid", gap: 16, maxWidth: 640 }}>
        <EditProfileForm
          fullName={user.fullName}
          mobileNumber={user.mobileNumber ?? ""}
          designation={user.designation ?? ""}
          country={user.country ?? ""}
        />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
