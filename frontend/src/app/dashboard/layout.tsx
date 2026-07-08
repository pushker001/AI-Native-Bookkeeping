"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  ListOrdered, 
  CheckCircle2, 
  FileText, 
  PieChart, 
  Settings, 
  Search, 
  Bell, 
  ChevronDown,
  LogOut,
  Building,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">Loading workspace...</div>;
  }

  const organizationName = (session as any)?.organizationName || "Company Workspace";
  const userInitial = session?.user?.email?.[0].toUpperCase() || "U";

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/dashboard/transactions", icon: ListOrdered },
    { name: "Review Queue", href: "/dashboard/review", icon: CheckCircle2 },
    { name: "Financial Statements", href: "/dashboard/reports", icon: PieChart },
    { name: "Month-End Close", href: "/dashboard/close", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#222] bg-[#0a0a0a] flex flex-col fixed inset-y-0 z-10">
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-[#222]">
          <Link href="/dashboard" className="font-semibold tracking-tight flex items-center gap-2 text-white">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
            Leadger
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">Operations</div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive 
                    ? "bg-[#111] text-white border border-[#222]" 
                    : "text-gray-400 hover:text-white hover:bg-[#111]/50 border border-transparent"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-blue-500" : ""}`} />
                {item.name}
              </Link>
            )
          })}


        </div>

        {/* User / Company Switcher (Bottom) */}
        <div className="p-4 border-t border-[#222]">
          <button 
            className="w-full flex items-center gap-3 px-2 py-2 hover:bg-[#111] rounded-lg transition-colors text-left"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium shadow-sm">
              {userInitial}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-white truncate">{organizationName}</div>
              <div className="text-xs text-gray-500 truncate">{session?.user?.email}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* Minimal Elegant Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-20 left-4 w-56 bg-[#111] border border-[#222] rounded-xl shadow-2xl overflow-hidden py-1 z-50"
              >
                <div className="px-3 py-2 border-b border-[#222]">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Current Workspace</div>
                </div>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#1a1a1a] flex items-center gap-2">
                  <Building className="w-4 h-4" /> Company Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#1a1a1a] flex items-center gap-2 border-b border-[#222]">
                  <Settings className="w-4 h-4" /> Billing
                </button>
                <button 
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[#1a1a1a] flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative bg-black">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#222] bg-black/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
          
          <div />

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="relative text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border border-black"></span>
            </button>
            <div className="w-px h-6 bg-[#222]"></div>
            <Link href="/upload" className="bg-white text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors shadow-sm">
              Upload Data
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
