"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setTokens } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // On détecte si c'est un email
      const isEmail = username.includes("@");
      const payload = isEmail 
        ? { email: username, password, username: username }
        : { username, password };

      console.log("Trying login to:", `${API_URL}/api/v1/auth/token/`, payload);

      const res = await fetch(`${API_URL}/api/v1/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      console.log("Response:", res.status, data);

      if (!res.ok) {
        // Essaie aussi l'autre endpoint JWT standard
        if (res.status === 400 || res.status === 401) {
          const res2 = await fetch(`${API_URL}/api/token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data2 = await res2.json().catch(() => ({}));
          console.log("Retry /api/token/:", res2.status, data2);
          if (res2.ok && data2.access) {
            setTokens(data2.access, data2.refresh);
            router.push("/dashboard");
            return;
          }
        }
        setError(data.detail || data.error || "Identifiants incorrects.");
        return;
      }

      setTokens(data.access, data.refresh);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Impossible de se connecter au serveur. Vérifie que Django tourne sur 8000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-[#070b14]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-white/5"
      >
        <h1 className="mb-1 text-2xl font-black text-slate-900 dark:text-white">POLYRAAGA</h1>
        <p className="mb-6 text-sm text-slate-500">API: {API_URL}</p>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nom d'utilisateur ou email"
          className="mb-3 w-full rounded-xl border px-4 py-3 text-sm"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Mot de passe"
          className="mb-4 w-full rounded-xl border px-4 py-3 text-sm"
        />
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}