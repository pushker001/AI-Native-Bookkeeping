"use client";
import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { AlertCircle, CheckCircle, ChevronDown, Check } from "lucide-react";
interface FlaggedTransaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  ambiguity_reason?: string;
}

const ACCOUNTS = [
  // Revenue
  "Revenue",
  "SaaS Subscriptions Revenue",
  // Expenses — matching coa_initializer.py exactly
  "Payroll",
  "Payroll Taxes",
  "Software Subscriptions",
  "Advertising",
  "Travel",
  "Meals & Entertainment",
  "Rent & Office",
  "Professional Services",
  "Utilities & Communications",
  "Insurance",
  "Office Supplies",
  "Contractor Payments",
  "Bank Fees",
];

export default function ReviewQueue() {
  const [flagged, setFlagged] = useState<FlaggedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  // For the custom dropdown
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  useEffect(() => {
    fetchFlagged();
  }, []);

  const fetchFlagged = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      const res = await fetch(`${API_URL}/api/reports/flagged`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === "success") {
        setFlagged(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch flagged transactions");
    } finally {
      setLoading(false);
    }
  };

  const resolveTransaction = async (id: number, accountName: string) => {
    setResolvingId(id);
    setOpenDropdownId(null);
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      const res = await fetch(`${API_URL}/api/reports/resolve/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ account_name: accountName })
      });
      if (res.ok) {
        // Remove from UI instantly
        setFlagged(prev => prev.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error("Failed to resolve", e);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="text-white selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-light tracking-tight text-white/90">
            Review Queue
          </h1>
          <p className="text-white/50 mt-2 font-light">
            Transactions flagged by the AI engine requiring human validation.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : flagged.length === 0 ? (
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="text-green-400 w-8 h-8" />
            </div>
            <h3 className="text-xl text-white/90 font-light mb-2">Inbox Zero</h3>
            <p className="text-white/50 font-light max-w-sm">
              The AI was highly confident in all recent transactions. Your review queue is empty.
            </p>
          </div>
        ) : (
          <div className="bg-[#111111] border border-white/5 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="py-4 px-6 text-xs font-medium text-white/40 uppercase tracking-widest">Date</th>
                  <th className="py-4 px-6 text-xs font-medium text-white/40 uppercase tracking-widest">Description</th>
                  <th className="py-4 px-6 text-xs font-medium text-white/40 uppercase tracking-widest text-right">Amount</th>
                  <th className="py-4 px-6 text-xs font-medium text-white/40 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {flagged.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-5 px-6 text-sm text-white/60 font-light tabular-nums">
                      {tx.date}
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-orange-400/80" />
                        <div className="flex flex-col">
                          <span className="text-sm text-white/90 font-light">{tx.description}</span>
                          {tx.ambiguity_reason && (
                            <span className="text-xs text-orange-400/70 mt-1 font-mono">
                              AI: {tx.ambiguity_reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-sm text-right text-white/90 font-light tabular-nums">
                      ${Math.abs(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-5 px-6 text-right relative">
                      {resolvingId === tx.id ? (
                        <span className="text-xs text-indigo-400 animate-pulse">Resolving...</span>
                      ) : (
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={() => setOpenDropdownId(openDropdownId === tx.id ? null : tx.id)}
                            className="flex items-center gap-2 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all border border-white/5"
                          >
                            Assign Category
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          
                          {/* Custom Dropdown Menu */}
                          {openDropdownId === tx.id && (
                            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1A1A1A] border border-white/10 shadow-2xl z-50 backdrop-blur-xl max-h-72 overflow-y-auto">
                              <div className="p-1">
                                {ACCOUNTS.map(acc => (
                                  <button
                                    key={acc}
                                    onClick={() => resolveTransaction(tx.id, acc)}
                                    className="w-full text-left px-3 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center justify-between group/btn"
                                  >
                                    {acc}
                                    <Check className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 text-indigo-400" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}