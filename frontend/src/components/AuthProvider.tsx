"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

const PROTECTED_ROUTES = ["/upload", "/processing", "/dashboard"];
const AUTH_ROUTES = ["/login", "/signup", "/"];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    if (status === "loading") return; // Wait, don't redirect yet

    if (!session && isProtectedRoute) {
      router.replace("/login");
    } else if (session && isAuthRoute) {
      router.replace("/upload");
    }
  }, [session, status, pathname, router]);

  // Show blank dark screen while NextAuth is checking the session cookie
  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0a0a]" />;
  }

  // Block render if unauthenticated and on a protected page
  if (!session && isProtectedRoute) {
    return <div className="min-h-screen bg-[#0a0a0a]" />;
  }

  return <>{children}</>;
}