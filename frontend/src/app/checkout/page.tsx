"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Checkout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate a 2-second payment processing delay, then redirect to the upload portal
    setTimeout(() => {
      router.push("/upload");
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 text-slate-900 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-white p-8 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
      >
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-slate-400 hover:text-slate-900 text-sm mb-4 inline-block transition-colors">
            &larr; Back
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Complete your payment</h1>
          <p className="text-slate-500 text-sm mt-2">Get your 2026 tax return filed by our autonomous agents.</p>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-50 rounded-lg p-4 mb-8 border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-600">Leadger AI Tax Service</span>
            <span className="font-semibold">$150.00</span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-400">
            <span>Flat fee. No hidden CPA costs.</span>
          </div>
        </div>

        {/* Mock Payment Form */}
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="you@example.com" 
              className="w-full px-4 py-3 rounded-md bg-[#FDFDFD] border border-slate-200 focus:outline-none focus:border-slate-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Card Details</label>
            <input 
              type="text" 
              required 
              placeholder="4242  4242  4242  4242" 
              className="w-full px-4 py-3 rounded-md bg-[#FDFDFD] border border-slate-200 focus:outline-none focus:border-slate-400 transition-colors font-mono text-sm"
            />
          </div>

          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full mt-6 px-8 py-4 rounded-md bg-slate-900 text-white text-sm font-medium tracking-wide hover:bg-slate-800 transition-colors duration-300 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                Processing...
              </>
            ) : (
              "Pay $150"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          Secure Mock Checkout
        </div>
      </motion.div>
    </main>
  );
}