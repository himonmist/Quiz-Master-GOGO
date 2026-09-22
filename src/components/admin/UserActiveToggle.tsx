"use client";

import { useRouter } from "next/navigation";
import { setUserActive } from "@/app/admin/actions";

export function UserActiveToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  return (
    <button
      className="btn btn-ghost btn-sm"
      style={{ color: isActive ? "var(--color-danger)" : "var(--color-accent-2-700)" }}
      onClick={async () => {
        if (isActive && !confirm("Suspend this participant? They will be signed out immediately.")) return;
        await setUserActive(userId, !isActive);
        router.refresh();
      }}
    >
      {isActive ? "Suspend" : "Reactivate"}
    </button>
  );
}
