"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 flex">
      
      {/* Left side - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 bg-black">
        
        {/* Logo */}
        <Link href="/" className="absolute top-8 left-8 sm:left-16 lg:left-24 xl:left-32 font-semibold tracking-tight flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
          <div className="w-4 h-4 bg-white rounded-sm"></div>
          Leadger
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Welcome back.</h1>
          <p className="text-gray-400 mb-8 text-sm">Continue to your monthly bookkeeping workspace.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <Link href="#" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">Forgot password?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1 pb-4">
              <input type="checkbox" id="remember" className="rounded border-[#222] bg-[#111] text-blue-500 focus:ring-blue-500/30" />
              <label htmlFor="remember" className="text-sm text-gray-400 cursor-pointer">Remember me for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black font-medium py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-60 transition-colors text-sm shadow-sm"
            >
              {isSubmitting ? "Signing in..." : "Continue"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#222]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="flex items-center justify-center gap-2 bg-[#111] border border-[#222] rounded-lg py-2 hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-300">
              Google
            </button>
            <button type="button" className="flex items-center justify-center gap-2 bg-[#111] border border-[#222] rounded-lg py-2 hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-300">
              Microsoft
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="text-white hover:underline font-medium">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Abstract Animation */}
      <div className="hidden md:flex w-1/2 bg-[#0a0a0a] border-l border-[#222] relative items-center justify-center overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        {/* Abstract glowing elements */}
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-blue-500/20 rounded-full blur-[120px]"></div>
        
        <div className="z-10 w-96 p-8 border border-white/5 bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col gap-4">
          <div className="flex gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500/80"></div>
            <div className="w-2 h-2 rounded-full bg-green-500/80"></div>
          </div>
          <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-white/5 rounded w-full"></div>
          <div className="h-8 bg-white/5 rounded w-full"></div>
          <div className="h-8 bg-white/5 rounded w-3/4"></div>
        </div>
      </div>
    </main>
  );
}
