import { requireUser, SUPER_ADMIN_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewOrganizationForm } from "@/components/admin/NewOrganizationForm";
import { OrganizationRow } from "@/components/admin/OrganizationRow";

export default async function AdminOrganizationsPage() {
  await requireUser(SUPER_ADMIN_ROLES);

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { users: true, courses: true, quizzes: true, questions: true, categories: true, certificates: true, auditLogs: true, notifications: true } },
    },
  });

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Organizations</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>
        Manage the tenant organizations participants can select when they sign up.
      </p>

      <NewOrganizationForm />

      <div className="card elev-sm" style={{ padding: "8px 16px", marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Organization</th>
              <th>Status</th>
              <th>Users</th>
              <th>Content</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => {
              const { users, courses, quizzes, questions, categories, certificates, auditLogs, notifications } = org._count;
              const totalDependents = users + courses + quizzes + questions + categories + certificates + auditLogs + notifications;
              return (
                <OrganizationRow
                  key={org.id}
                  id={org.id}
                  name={org.name}
                  description={org.description}
                  isActive={org.isActive}
                  counts={{ users, courses, quizzes, questions }}
                  canDelete={totalDependents === 0}
                />
              );
            })}
            {organizations.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No organizations yet — create one above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
