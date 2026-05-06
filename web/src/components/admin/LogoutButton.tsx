"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.push("/admin/login");
  };

  return (
    <Button type="button" variant="secondary" onClick={logout}>
      Sair
    </Button>
  );
}

