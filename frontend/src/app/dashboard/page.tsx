"use client";
import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  AlertCircle, 
  Check, 
  Activity, 
  DollarSign, 
  Calculator,
  Download
} from "lucide-react";

interface FlaggedTransaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  ambiguity_reason: string;
}

const ACCOUNT_CATEGORIES = [
  { label: "Revenue", account_name: "Revenue" },
  { label: "Revenue (SaaS)", account_name: "SaaS Subscriptions Revenue" },
  { label: "Payroll", account_name: "Payroll" },
  { label: "Payroll Taxes", account_name: "Payroll Taxes" },
  { label: "Software Subscriptions", account_name: "Software Subscriptions" },
  { label: "Advertising", account_name: "Advertising" },
  { label: "Travel", account_name: "Travel" },
  { label: "Meals & Entertainment", account_name: "Meals & Entertainment" },
  { label: "Rent & Office", account_name: "Rent & Office" },
  { label: "Professional Services", account_name: "Professional Services" },
  { label: "Utilities & Communications", account_name: "Utilities & Communications" },
  { label: "Insurance", account_name: "Insurance" },
  { label: "Office Supplies", account_name: "Office Supplies" },
  { label: "Contractor Payments", account_name: "Contractor Payments" },
  { label: "Bank Fees", account_name: "Bank Fees" },
];

export default function Dashboard() {
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState<Record<string, number>>({});
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  const [startingBalance, setStartingBalance] = useState("");
  const [endingBalance, setEndingBalance] = useState("");
  const [reconciliationResult, setReconciliationResult] = useState<any>(null);
  
  const [flagged, setFlagged] = useState<FlaggedTransaction[]>([]);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);

  const router = useRouter();

  const fetchData = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;

      if (!session) {
        router.push("/login");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const pnlRes = await fetch(`${API_URL}/api/reports/pnl`, { headers });
      if (pnlRes.status === 401) {
          router.push("/login");
          return;
      }
      const pnlData = await pnlRes.json();
      if (pnlData.status === "success") {
        setRevenue(pnlData.data.revenue);
        setExpenses(pnlData.data.expenses_breakdown);
        setTotalExpenses(pnlData.data.total_expenses);
        setNetProfit(pnlData.data.net_profit);
      }

      const flagRes = await fetch(`${API_URL}/api/reports/flagged`, { headers });
      const flagData = await flagRes.json();
      if (flagData.status === "success") {
        setFlagged(flagData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (transactionId: number) => {
    const selectedIdx = selections[transactionId];
    if (selectedIdx === undefined) return;
    
    setResolvingId(transactionId);
    const selectedCat = ACCOUNT_CATEGORIES[selectedIdx];

    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      
      const res = await fetch(`${API_URL}/api/reports/resolve/${transactionId}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          account_name: selectedCat.account_name
        })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error resolving flag:", error);
    } finally {
      setResolvingId(null);
    }
  };

  const handleReconcile = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      
      const res = await fetch(`${API_URL}/api/reports/reconcile`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          starting_balance: parseFloat(startingBalance) || 0,
          ending_balance: parseFloat(endingBalance) || 0
        })
      });

      const data = await res.json();
      if (data.status === "success") {
        setReconciliationResult(data.data);
      }
    } catch (error) {
      console.error("Reconciliation error:", error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      
      const res = await fetch(`${API_URL}/api/reports/export`, {
        headers: { 
            "Authorization": `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cpa_export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      
      {/* Hero Section */}
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Good morning.</h1>
        
        {/* Progress Timeline Widget */}
        <div className="mt-8 bg-[#111] border border-[#222] rounded-2xl p-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-gray-400 font-medium text-sm uppercase tracking-wider mb-1">June Books Status</h2>
              <div className="text-4xl font-semibold text-white tracking-tight">87% <span className="text-xl text-gray-500 font-normal">Closed</span></div>
            </div>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Export for CPA"}
            </button>
          </div>
          
          <div className="relative pt-2">
            {/* Background Bar */}
            <div className="h-2 w-full bg-[#222] rounded-full overflow-hidden">
              {/* Progress Fill */}
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "87%" }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-blue-500 rounded-full"
              ></motion.div>
            </div>
            
            {/* Timeline Steps */}
            <div className="flex justify-between mt-4 text-xs font-medium">
              <div className="flex flex-col items-center gap-1 text-blue-500">
                <CheckCircle2 className="w-4 h-4" />
                Imported
              </div>
              <div className="flex flex-col items-center gap-1 text-blue-500">
                <CheckCircle2 className="w-4 h-4" />
                Categorized
              </div>
              <div className="flex flex-col items-center gap-1 text-white">
                <Activity className="w-4 h-4 text-yellow-500" />
                Review
              </div>
              <div className="flex flex-col items-center gap-1 text-gray-500">
                <Circle className="w-4 h-4" />
                Reconciled
              </div>
              <div className="flex flex-col items-center gap-1 text-gray-500">
                <Circle className="w-4 h-4" />
                CPA Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* P&L Snapshot */}
        <section className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            Financial Snapshot
          </h3>
          
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-[#222] border-b border-[#222]">
              <div className="p-5">
                <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
                <div className="text-2xl font-semibold text-white">${revenue.toLocaleString()}</div>
              </div>
              <div className="p-5">
                <div className="text-sm text-gray-500 mb-1">Total Expenses</div>
                <div className="text-2xl font-semibold text-white">${totalExpenses.toLocaleString()}</div>
              </div>
              <div className="p-5 bg-gradient-to-br from-blue-500/5 to-transparent">
                <div className="text-sm text-blue-400 mb-1 font-medium">Net Profit</div>
                <div className="text-2xl font-semibold text-white">${netProfit.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="p-5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Expense Breakdown</h4>
              <div className="space-y-3">
                {Object.entries(expenses).length === 0 ? (
                  <div className="text-gray-500 text-sm">No expenses categorized yet.</div>
                ) : (
                  Object.entries(expenses).map(([name, amount]) => (
                    <div key={name} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">{name}</span>
                      <span className="font-mono text-gray-400">${amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Flagged Transactions Queue */}
          {flagged.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Review Queue <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-0.5 rounded-full">{flagged.length}</span>
              </h3>
              
              <div className="space-y-3">
                {flagged.map((item) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    key={item.id} 
                    className="bg-[#111] border border-yellow-500/20 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-white">{item.description}</span>
                        {item.amount && <span className="text-gray-400 font-mono text-sm">${item.amount}</span>}
                      </div>
                      <p className="text-xs text-yellow-500/80">AI Flag: Requires human categorization</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto items-center">
                      <select 
                        className="bg-black border border-[#333] text-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 transition-colors"
                        onChange={(e) => setSelections({...selections, [item.id]: parseInt(e.target.value)})}
                        defaultValue=""
                      >
                        <option value="" disabled>Select Category...</option>
                        {ACCOUNT_CATEGORIES.map((cat, idx) => (
                          <option key={idx} value={idx}>{cat.label}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleResolve(item.id)}
                        disabled={selections[item.id] === undefined || resolvingId === item.id}
                        className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {resolvingId === item.id ? "Saving..." : "Approve"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Sidebar Widgets */}
        <aside className="space-y-6">
          
          {/* Bank Reconciliation */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <h3 className="text-base font-medium text-white flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-gray-400" />
              Bank Match
            </h3>
            
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Starting Balance</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={startingBalance}
                  onChange={e => setStartingBalance(e.target.value)}
                  className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ending Balance</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={endingBalance}
                  onChange={e => setEndingBalance(e.target.value)}
                  className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleReconcile}
              className="w-full bg-[#222] text-white hover:bg-[#333] border border-[#333] py-2 rounded-lg text-sm font-medium transition-colors mb-4"
            >
              Run Match
            </button>

            {reconciliationResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className={`p-3 rounded-lg text-sm border ${
                  reconciliationResult.is_reconciled 
                    ? "bg-green-500/10 border-green-500/20 text-green-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {reconciliationResult.is_reconciled ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Match Successful
                  </div>
                ) : (
                  <div>
                    <div className="font-medium mb-1">Discrepancy Found</div>
                    <div className="text-xs opacity-80">
                      Calculated: ${reconciliationResult.calculated_ending_balance}<br/>
                      Difference: ${reconciliationResult.discrepancy}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
          
        </aside>
      </div>

    </div>
  );
}