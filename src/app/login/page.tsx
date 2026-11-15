"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setTokens } from "@/lib/api";
import { Lock, User, AlertCircle, Sparkles, ArrowRight, Loader2, Server, CheckCircle2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "waking" | "offline">("checking");

  useEffect(() => {
    // Vérification de la disponibilité du serveur en arrière-plan
    let isMounted = true;
    const checkApi = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${API_URL}/api/v1/auth/token/`, {
          method: "OPTIONS",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (isMounted) {
          setApiStatus("online");
        }
      } catch (err: any) {
        if (isMounted) {
          // Sur Render en plan gratuit, le serveur peut être en train de se réveiller
          setApiStatus("waking");
        }
      }
    };
    checkApi();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isEmail = username.includes("@");
      const payload = isEmail
        ? { email: username, password, username: username }
        : { username, password };

      // Création d'un contrôleur avec un timeout de 45 secondes pour tolérer les cold starts de Render
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      let res: Response;
      try {
        res = await fetch(`${API_URL}/api/v1/auth/token/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (networkErr: any) {
        // En cas d'échec sur /api/v1/auth/token/, tenter /api/token/
        res = await fetch(`${API_URL}/api/token/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401 || res.status === 400) {
          setError(
            data.detail ||
              data.error ||
              "Identifiants invalides. Veuillez vérifier votre nom d'utilisateur et mot de passe."
          );
        } else if (res.status === 502 || res.status === 503) {
          setError("Le serveur backend redémarre. Veuillez patienter 20 secondes et réessayer.");
        } else {
          setError(data.detail || data.error || `Erreur serveur (${res.status}).`);
        }
        return;
      }

      if (data.access) {
        setTokens(data.access, data.refresh || "");
        router.push("/dashboard");
      } else {
        setError("Réponse inattendue du serveur d'authentification.");
      }
    } catch (err: any) {
      console.error("Login fetch error:", err);
      if (err.name === "AbortError") {
        setError("Le serveur met trop de temps à répondre (redémarrage en cours). Réessayez dans un instant.");
      } else {
        setError(
          `Impossible de joindre le serveur API (${API_URL}). Vérifiez que le serveur est démarré et que les autorisations CORS incluent cette adresse.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7] dark:bg-[#0B0C0F] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Polyraaga Dashboard Studio
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Connexion Administrateur
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5">
            Accédez à la gestion centralisée de vos ventes, IA et clients WhatsApp
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-black/5 space-y-6">
          {/* API Server status indicator */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)] text-xs">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span className="font-mono text-[11px] text-[var(--text-secondary)] truncate max-w-[200px]" title={API_URL}>
                {API_URL.replace("https://", "")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiStatus === "online"
                    ? "bg-[var(--success)] animate-pulse"
                    : apiStatus === "waking"
                    ? "bg-[var(--warm)] animate-ping"
                    : "bg-[var(--text-tertiary)]"
                }`}
              />
              <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                {apiStatus === "online" ? "En ligne" : apiStatus === "waking" ? "Démarrage..." : "Connexion"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                Nom d&apos;utilisateur ou Email
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: admin ou contact@polyraaga.com"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-tertiary)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-tertiary)]"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-xs text-[var(--danger)] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg shadow-[var(--accent)]/25 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-[var(--text-tertiary)] mt-6">
          Polyraaga E-Commerce Studio &copy; {new Date().getFullYear()} • Tous droits réservés
        </p>
      </div>
    </div>
  );
}
