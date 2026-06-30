"use client"; // Critical — SessionProvider uses React Context which only works in the browser

import { SessionProvider } from "next-auth/react";

export default function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
