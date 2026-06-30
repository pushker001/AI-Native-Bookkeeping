"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { UploadCloud, FileText, Landmark, ArrowRight, ArrowLeft } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const session = await getSession();
        const token = (session as any)?.accessToken;
        if (!token) return;

        const response = await axios.get(`${API_URL}/api/users/accounts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.data) {
          setAccounts(response.data.data);
          // Set default to Checking Account if available
          const checking = response.data.data.find((a: any) => a.name === "Checking Account");
          if (checking) setSelectedAccountId(checking.id.toString());
          else if (response.data.data.length > 0) setSelectedAccountId(response.data.data[0].id.toString());
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      }
    };
    fetchAccounts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;

      if (!session) {
          router.push("/login");
          return;
      }

      const response = await axios.post(`${API_URL}/api/upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        },
      });

      localStorage.setItem("uploaded_transactions", JSON.stringify(response.data.transactions || []));
      localStorage.setItem("source_account_id", selectedAccountId);
      router.push("/processing");
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Something went wrong uploading the file.");
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 flex flex-col relative overflow-hidden">
      
      {/* Navbar Minimal */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="font-semibold tracking-tight flex items-center gap-2 text-white">
          <div className="w-4 h-4 bg-white rounded-sm"></div>
          Leadger
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl w-full"
        >
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Upload your financial data</h1>
            <p className="text-gray-400">Our AI will categorize, reconcile, and close your books automatically.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* File Upload Dropzone */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 flex flex-col items-center text-center relative group hover:border-blue-500/50 transition-colors">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="w-16 h-16 bg-[#111] border border-[#222] rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 group-hover:text-blue-500 transition-colors text-gray-400">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Upload Files</h3>
              <p className="text-sm text-gray-500 mb-6">Drag and drop your bank statements (CSV) securely.</p>
              
              <div className="mt-auto pt-4 border-t border-[#222] w-full flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                  <FileText className="w-3 h-3" /> CSV supported
                </div>
                {file && <span className="text-blue-400 text-xs font-medium truncate max-w-[120px]">{file.name}</span>}
              </div>
              
              {/* Account Selector */}
              {accounts.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#222] w-full text-left relative z-20" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Select Account:</label>
                  <select 
                    className="w-full bg-[#111] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type === 'ASSET' ? 'Checking' : 'Credit Card'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Bank Connection (Mock) */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 flex flex-col items-center text-center opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="w-16 h-16 bg-[#111] border border-[#222] rounded-full flex items-center justify-center mb-6 text-gray-400">
                <Landmark className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Connect Bank</h3>
              <p className="text-sm text-gray-500 mb-6">Link your bank securely via Plaid for automated monthly syncing.</p>
              
              <div className="mt-auto pt-4 border-t border-[#222] w-full text-left">
                <div className="inline-block bg-[#111] border border-[#222] text-gray-400 text-[10px] uppercase tracking-wider px-2 py-1 rounded">
                  Coming Soon
                </div>
              </div>
            </div>

          </div>

          <div className="mt-12 flex justify-center">
            <button 
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`px-8 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
                file && !isUploading 
                  ? "bg-white text-black hover:bg-gray-200" 
                  : "bg-[#222] text-gray-500 cursor-not-allowed border border-[#333]"
              }`}
            >
              {isUploading ? "Uploading Data..." : "Continue to Processing"} 
              {!isUploading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

        </motion.div>
      </div>
      
      {/* Subtle Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-500/10 blur-[150px] pointer-events-none rounded-full"></div>
    </main>
  );
}