"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";

/** "/" just sends people to the right place. The public landing page can replace this later. */
export default function Home() {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
    else if (status === "anonymous") router.replace("/login");
  }, [status, router]);
  return null;
}
