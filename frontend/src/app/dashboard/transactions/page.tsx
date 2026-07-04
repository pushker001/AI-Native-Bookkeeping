"use client";
import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { Search, ArrowUpDown, Tag } from "lucide-react";

interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
}

export default function TransactionsLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      
      const res = await fetch(`${API_URL}/api/reports/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const json = await res.json();
      if (json.status === "success") {
        setTransactions(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch transactions", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="text-white max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white/90">
            Universal Ledger
          </h1>
          <p className="text-white/50 mt-2 font-light">
            Search and browse all your categorized transactions across all accounts.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#111] border border-[#222] rounded-2xl p-4 mb-6 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-500" />
        <input 
          type="text"
          placeholder="Search by merchant or category... (e.g. 'AWS' or 'Software')"
          className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600 font-light"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="text-xs text-gray-500 font-mono">
          {filteredTransactions.length} results
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222] bg-black/20">
                <th className="py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:text-gray-300">
                  Date <ArrowUpDown className="w-3 h-3" />
                </th>
                <th className="py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-widest">Description</th>
                <th className="py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-widest">Category</th>
                <th className="py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500 font-light">
                    No transactions found matching your search.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-6 text-sm text-gray-500 tabular-nums">
                      {tx.date}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-200 font-light">
                      {tx.description}
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                        <Tag className="w-3 h-3" />
                        {tx.category}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-right text-gray-100 font-light tabular-nums">
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
