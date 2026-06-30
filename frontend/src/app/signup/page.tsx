"use client";
import { API_URL } from "@/lib/api";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [country, setCountry] = useState("United States");
  const [businessType, setBusinessType] = useState("");
  const [monthlyTransactions, setMonthlyTransactions] = useState("0 - 100");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the Terms of Service.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          organization_name: organizationName,
          country,
          business_type: businessType,
          monthly_transactions: monthlyTransactions
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Registration failed. Email may already be in use.");
        setIsSubmitting(false);
        return;
      }

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
      } else {
        setError("Account created but login failed. Please sign in manually.");
        router.push("/login");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 flex">
      
      {/* Left side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 py-12 lg:px-24 xl:px-32 relative z-10 bg-black overflow-y-auto">
        
        <Link href="/" className="absolute top-8 left-8 sm:left-16 lg:left-24 xl:left-32 font-semibold tracking-tight flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
          <div className="w-4 h-4 bg-white rounded-sm"></div>
          Leadger
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-16 lg:mt-0">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Welcome to the future of bookkeeping.</h1>
          <p className="text-gray-400 mb-8 text-sm max-w-md">Create your company account and let us handle your monthly books.</p>

          <form onSubmit={handleSignup} className="space-y-4 max-w-md">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Company Name</label>
              <input type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" placeholder="Acme Corp" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Business Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" placeholder="founder@acme.com" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" placeholder="••••••••" required minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" placeholder="••••••••" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Country</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm appearance-none">
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Business Type</label>
                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm appearance-none" required>
                  <option value="" disabled>Select...</option>
                  <option value="LLC">LLC</option>
                  <option value="C-Corp">C-Corp</option>
                  <option value="S-Corp">S-Corp</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Monthly Transactions</label>
              <select value={monthlyTransactions} onChange={(e) => setMonthlyTransactions(e.target.value)} className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm appearance-none">
                <option value="0 - 100">0 - 100</option>
                <option value="101 - 500">101 - 500</option>
                <option value="500 - 2000">500 - 2000</option>
                <option value="2000+">2000+</option>
              </select>
            </div>

            <div className="flex items-start gap-3 py-3">
              <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 rounded border-[#222] bg-[#111] text-blue-500 focus:ring-blue-500/30" />
              <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer leading-relaxed">
                I agree to the Terms of Service, Privacy Policy, and authorize Leadger to process financial data on behalf of this company.
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black font-medium py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-60 transition-colors text-sm shadow-sm mt-2">
              {isSubmitting ? "Creating company..." : "Create Company"}
            </button>
          </form>

          <div className="relative my-8 max-w-md">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#222]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <button type="button" className="flex items-center justify-center gap-2 bg-[#111] border border-[#222] rounded-lg py-2 hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-300">
              Google
            </button>
            <button type="button" className="flex items-center justify-center gap-2 bg-[#111] border border-[#222] rounded-lg py-2 hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-300">
              Microsoft
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8 max-w-md">
            Already have an account?{" "}
            <Link href="/login" className="text-white hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Abstract Animation */}
      <div className="hidden lg:flex w-1/2 bg-[#0a0a0a] border-l border-[#222] relative items-center justify-center overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
        
        <div className="z-10 w-[400px] flex flex-col gap-4">
          {/* Faux Data Processing Animation */}
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="p-4 border border-white/10 bg-black/50 backdrop-blur-md rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Check className="w-4 h-4 text-gray-400" /></div>
              <div>
                <p className="text-sm font-medium text-white">Ingesting Bank Feeds</p>
                <p className="text-xs text-gray-500 font-mono">Chase, Mercury, Brex</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="p-4 border border-blue-500/30 bg-blue-500/5 backdrop-blur-md rounded-xl flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-100">AI Categorization Engine</p>
                <p className="text-xs text-blue-500/70 font-mono">Processing 1,204 transactions</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="p-4 border border-white/5 bg-black/30 backdrop-blur-md rounded-xl flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div></div>
              <div>
                <p className="text-sm font-medium text-gray-400">Month-End Close</p>
                <p className="text-xs text-gray-600 font-mono">Awaiting categorization</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}