"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Accès refusé.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-white/5 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-3 h-3 bg-[#4ade80] rounded-full animate-pulse" />
          <h1 className="text-white font-bold tracking-tighter text-xl">STATUS.ENISUVI.CLOUD</h1>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Mot de passe administrateur"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4ade80]/50 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button className="w-full bg-[#4ade80] text-black font-bold py-3 rounded-xl hover:bg-[#3bc771] transition-colors">
            SE CONNECTER
          </button>
        </form>
      </div>
    </div>
  );
}