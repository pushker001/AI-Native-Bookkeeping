"use client";
import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { ArrowDownRight, ArrowUpRight, DollarSign, TrendingUp, Download } from "lucide-react";

interface PnlData {
  revenue: number;
  expenses_breakdown: Record<string, number>;
  total_expenses: number;
  net_profit: number;
}

export default function FinancialReports() {
  const [data, setData] = useState<PnlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drillTransactions, setDrillTransactions] = useState<any[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => {
    fetchPnl();
  }, []);

  const fetchPnl = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      
      const res = await fetch(`${API_URL}/api/reports/pnl`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        return;
      }
      
      const json = await res.json();
      if (json.status === "success") {
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch PNL", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionsByCategory = async (accountName: string) => {
    if (selectedCategory === accountName) {
      setSelectedCategory(null);
      setDrillTransactions([]);
      return;
    }
    setSelectedCategory(accountName);
    setDrillLoading(true);
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      const res = await fetch(`${API_URL}/api/reports/transactions/${encodeURIComponent(accountName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === "success") {
        setDrillTransactions(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch transactions", e);
    } finally {
      setDrillLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-gray-500 text-center mt-20">
        No financial data available. Upload some transactions first.
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const isProfitable = data.net_profit >= 0;

  return (
    <div className="text-white max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white/90">
            Profit & Loss
          </h1>
          <p className="text-white/50 mt-2 font-light">
            Year-to-date financial performance generated from your double-entry ledger.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
          <Download className="w-4 h-4" />
          Export for CPA
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Revenue Card */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-green-400 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest">Total Revenue</h2>
          </div>
          <div className="text-4xl font-light text-white tracking-tight">
            {formatCurrency(data.revenue)}
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-red-400 group-hover:scale-110 transition-transform">
            <ArrowDownRight className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <DollarSign className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest">Total Expenses</h2>
          </div>
          <div className="text-4xl font-light text-white tracking-tight">
            {formatCurrency(data.total_expenses)}
          </div>
        </div>

        {/* Net Profit Card */}
        <div className={`border rounded-2xl p-6 relative overflow-hidden transition-colors ${
          isProfitable ? "bg-blue-900/10 border-blue-500/30" : "bg-orange-900/10 border-orange-500/30"
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest">Net Profit</h2>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isProfitable ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}>
              {isProfitable ? "Profitable" : "Operating Loss"}
            </div>
          </div>
          <div className={`text-5xl font-light tracking-tight ${isProfitable ? "text-white" : "text-white"}`}>
            {formatCurrency(data.net_profit)}
          </div>
        </div>
      </div>

      {/* Expenses Breakdown Table */}
      <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#222] bg-white/[0.02]">
          <h3 className="text-lg font-medium text-white/90">Operating Expenses Breakdown</h3>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#222] bg-black/20">
              <th className="py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-widest">Category</th>
              <th className="py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-widest text-right">Amount</th>
              <th className="py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-widest text-right">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {Object.entries(data.expenses_breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = data.total_expenses > 0 
                  ? ((amount / data.total_expenses) * 100).toFixed(1) 
                  : "0.0";
                  
                return (
                  <tr 
                    key={category} 
                    onClick={() => fetchTransactionsByCategory(category)}
                    className={`cursor-pointer group transition-colors ${
                      selectedCategory === category
                        ? "bg-blue-500/10 border-l-2 border-l-blue-500"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="py-4 px-6 text-sm text-gray-300 font-light">
                      <div className="flex items-center gap-2">
                        {category}
                        <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to expand →
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-right text-gray-100 font-light tabular-nums">
                      {formatCurrency(amount)}
                    </td>
                    <td className="py-4 px-6 text-right w-48">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-xs text-gray-500 tabular-nums w-10 text-right">{percentage}%</span>
                        <div className="w-24 h-1.5 bg-[#222] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
            })}
          </tbody>
          <tfoot className="bg-black/20 border-t border-[#222]">
            <tr>
              <td className="py-5 px-6 text-sm font-medium text-gray-400 uppercase tracking-widest">
                Total Expenses
              </td>
              <td className="py-5 px-6 text-sm font-medium text-white text-right tabular-nums">
                {formatCurrency(data.total_expenses)}
              </td>
              <td className="py-5 px-6"></td>
            </tr>
          </tfoot>
        </table>
        
        {selectedCategory && (
          <div className="border-t border-[#222] bg-black/30">
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#222]">
              <h4 className="text-sm font-medium text-blue-400">
                {selectedCategory} — {drillTransactions.length} transactions
              </h4>
              <button
                onClick={() => { setSelectedCategory(null); setDrillTransactions([]); }}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Close ✕
              </button>
            </div>
            {drillLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#222]">
                    <th className="py-3 px-6 text-xs text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="py-3 px-6 text-xs text-gray-500 uppercase tracking-widest">Description</th>
                    <th className="py-3 px-6 text-xs text-gray-500 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]/50">
                  {drillTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 px-6 text-xs text-gray-500 tabular-nums">{txn.date}</td>
                      <td className="py-3 px-6 text-sm text-gray-300 font-light">{txn.description}</td>
                      <td className="py-3 px-6 text-sm text-right text-gray-100 tabular-nums font-light">
                        {formatCurrency(txn.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
