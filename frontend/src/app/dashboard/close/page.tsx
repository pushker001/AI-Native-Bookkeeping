"use client";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { Lock, CheckCircle2, AlertCircle, Loader2, Calendar } from "lucide-react";

interface ClosedPeriod {
  period: string;
  closed_at: string;
}

// Generate the last 6 months as options
function getLast6Months(): string[] {
  const months = [];
  const now = new Date();
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
  }
  return months;
}

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

export default function MonthEndClosePage() {
  const [closedPeriods, setClosedPeriods] = useState<ClosedPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const months = getLast6Months();

  useEffect(() => {
    fetchClosedMonths();
  }, []);

  const fetchClosedMonths = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      const res = await fetch(`${API_URL}/api/close/months`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.status === "success") {
        setClosedPeriods(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch closed months", e);
    } finally {
      setLoading(false);
    }
  };

  const closeMonth = async (period: string) => {
    setClosing(period);
    setMessage(null);
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      const res = await fetch(`${API_URL}/api/close/month`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ period }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: json.message });
        fetchClosedMonths(); // Refresh the list
      } else {
        setMessage({ type: "error", text: json.detail });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setClosing(null);
    }
  };

  const isClosed = (period: string) =>
    closedPeriods.some((c) => c.period === period);

  const getClosedAt = (period: string) =>
    closedPeriods.find((c) => c.period === period)?.closed_at;

  return (
    <div className="text-white max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-white/90">
          Month-End Close
        </h1>
        <p className="text-white/50 mt-2 font-light">
          Lock a month to permanently freeze its transactions. Once closed, no AI or human can edit that period.
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-light border ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Month Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {months.map((period) => {
            const closed = isClosed(period);
            const closedAt = getClosedAt(period);
            const isClosing = closing === period;

            return (
              <div
                key={period}
                className={`flex items-center justify-between px-6 py-5 rounded-2xl border transition-all ${
                  closed
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-[#111] border-[#222] hover:border-[#333]"
                }`}
              >
                {/* Left: Month Info */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      closed ? "bg-green-500/10" : "bg-white/5"
                    }`}
                  >
                    {closed ? (
                      <Lock className="w-4 h-4 text-green-400" />
                    ) : (
                      <Calendar className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/90">
                      {formatPeriod(period)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 font-light">
                      {closed
                        ? `Locked on ${new Date(closedAt!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                        : "Open — transactions can still be edited"}
                    </div>
                  </div>
                </div>

                {/* Right: Action */}
                {closed ? (
                  <div className="flex items-center gap-2 text-green-400 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Closed
                  </div>
                ) : (
                  <button
                    onClick={() => closeMonth(period)}
                    disabled={isClosing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isClosing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    {isClosing ? "Locking..." : "Lock Month"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-500/5 border border-blue-500/10 rounded-2xl px-6 py-5">
        <h3 className="text-sm font-medium text-blue-400 mb-2">How it works</h3>
        <ul className="text-xs text-gray-500 font-light space-y-1.5 list-disc list-inside">
          <li>Before locking, all transactions in that month must be categorized.</li>
          <li>If any transaction is still in the Review Queue, the lock will be blocked.</li>
          <li>Once locked, no AI or human can edit, delete or recategorize any transaction in that month.</li>
          <li>This guarantees your financial records match exactly what you filed with the IRS.</li>
        </ul>
      </div>
    </div>
  );
}
