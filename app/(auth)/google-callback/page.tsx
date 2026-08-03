"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/isAdmin", {
          credentials: "include",
        });

        if (!res.ok) {
          router.replace("/dashboard");
          return;
        }

        const { isAdmin } = await res.json();

        if (isAdmin) {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/dashboard");
        }
      } catch {
        router.replace("/dashboard");
      }
    }

    checkAdmin();
  }, [router]);

  return <p>Signing you in...</p>;
}
