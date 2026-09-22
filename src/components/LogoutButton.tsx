"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const router = useRouter();
  return (
    <button
      className={className}
      style={style}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
