"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, ChevronRight, BarChart3, Lock, Zap } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <Link href="/" className="font-semibold text-lg tracking-tight flex items-center gap-2">
              <div className="w-5 h-5 bg-white rounded-sm"></div>
              Leadger
            </Link>
            
            {/* Desktop Nav Links */}
            <div className="hidden md:flex gap-6 text-sm text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">Product</Link>
              <Link href="#" className="hover:text-white transition-colors">How It Works</Link>
              <Link href="#" className="hover:text-white transition-colors">Security</Link>
              <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="#" className="hover:text-white transition-colors">Blog</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link>
            <Link 
              href="/signup" 
              className="bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 flex flex-col items-center text-center">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-gray-300 font-mono mb-8 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Now accepting Q3 waitlist
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-semibold tracking-tighter mb-8 text-white max-w-4xl leading-[1.05]"
        >
          Stop doing bookkeeping.
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed"
        >
          Upload your monthly bank transactions. Our AI accountants categorize, review, reconcile and deliver CPA-ready books every month.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link 
            href="/signup"
            className="px-8 py-4 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
          >
            Start Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="#"
            className="px-8 py-4 rounded-full border border-white/10 bg-transparent text-white text-sm font-medium hover:bg-white/5 transition-all"
          >
            Book Demo
          </Link>
        </motion.div>
        
      </section>

      {/* Abstract App Preview */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="max-w-5xl mx-auto px-6 pb-40"
      >
        <div className="w-full h-80 md:h-[500px] bg-[#111] rounded-2xl border border-white/10 flex flex-col relative overflow-hidden group">
          {/* Faux Header */}
          <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-white/20"></div>
            <div className="w-3 h-3 rounded-full bg-white/20"></div>
            <div className="w-3 h-3 rounded-full bg-white/20"></div>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative">
            {/* Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(37,99,235,0.3)]">
                <BarChart3 className="text-white w-8 h-8" />
              </div>
              <p className="text-white font-medium text-lg mb-2">Leadger Intelligence Engine</p>
              <p className="text-gray-500 font-mono text-sm">Processing 14,023 transactions...</p>
            </div>
          </div>
          
          {/* Subtle glow effect */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-blue-500/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-semibold text-white">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
            Leadger
          </div>
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Leadger Inc. We are an accounting firm, not a software company.
          </div>
        </div>
      </footer>

    </main>
  );
}