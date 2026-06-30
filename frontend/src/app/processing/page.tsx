"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { getSession } from "next-auth/react";
import { Terminal, CheckCircle2, Circle, Loader2 } from "lucide-react";

const aiSteps = [
  "Ingesting and parsing raw financial data...",
  "Running Vision Agent for merchant normalization...",
  "Categorizing transactions via LLM reasoning...",
  "Performing historical pattern lookup...",
  "Applying IRS Tax Code rules and reasoning...",
  "Generating Double-Entry ledger records...",
  "Flagging ambiguous transactions for human review..."
];

export default function Processing() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const router = useRouter();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // 1. Visual animation sequence
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < aiSteps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 2000);

    // 2. Trigger AI Backend
    const processData = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      try {
        const storedTxns = localStorage.getItem("uploaded_transactions");
        const sourceAccountId = localStorage.getItem("source_account_id");
        if (!storedTxns) throw new Error("No transactions found.");
        
        const rawTransactions = JSON.parse(storedTxns);
        const payload = {
            source_account_id: sourceAccountId ? parseInt(sourceAccountId) : 1, // Default fallback
            transactions: rawTransactions
        };

        const session = await getSession();
        const token = (session as any)?.accessToken;

        if (!session) {
            router.push("/login");
            return;
        }

        const response = await axios.post(`${API_URL}/api/process/`, payload, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        
        localStorage.setItem("final_tax_data", JSON.stringify(response.data.results));

        setTimeout(() => {
          router.push("/dashboard");
        }, Math.max(0, (aiSteps.length * 2000) - (Date.now() - startTime)));

      } catch (error) {
        console.error("AI Processing failed:", error);
        alert("The AI encountered an error while processing your data.");
        router.push("/upload");
      }
    };

    const startTime = Date.now();
    processData();

    return () => clearInterval(interval);
  }, [router]);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      
      {/* Abstract Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-2xl w-full relative z-10">
        
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#111] border border-[#222] flex items-center justify-center mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
            <Terminal className="w-8 h-8 text-blue-500 relative z-10" />
          </div>
          <h1 className="text-2xl font-medium tracking-tight mb-2">Leadger Intelligence Engine</h1>
          <p className="text-gray-500 text-sm">Autonomous agents are processing your financial data.</p>
        </div>

        {/* The "Terminal" UI */}
        <div className="bg-[#0a0a0a] rounded-xl shadow-2xl border border-[#222] p-6 overflow-hidden relative">
          
          {/* Top Bar */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#222]">
            <div className="w-3 h-3 rounded-full bg-[#333]"></div>
            <div className="w-3 h-3 rounded-full bg-[#333]"></div>
            <div className="w-3 h-3 rounded-full bg-[#333]"></div>
            <div className="ml-4 text-xs font-mono text-gray-500">process_transactions.py</div>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {aiSteps.map((step, index) => {
                if (index > currentStepIndex) return null;
                
                const isCurrent = index === currentStepIndex;
                const isComplete = index < currentStepIndex;

                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4"
                  >
                    <div className="mt-0.5">
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#333]" />
                      )}
                    </div>
                    <span className={`text-sm font-mono tracking-tight ${isCurrent ? "text-white" : "text-gray-500"}`}>
                      {step}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {/* Faux Code execution effect at bottom */}
          <div className="mt-8 pt-4 border-t border-[#222] flex items-center justify-between text-[10px] font-mono text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500/50 animate-ping"></span>
              Executing LLM inference
            </div>
            <div>Model: Llama 3.3 70B</div>
          </div>
        </div>

      </div>
    </main>
  );
}