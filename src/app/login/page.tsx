"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { LuBuilding } from "react-icons/lu";
import { useRouter } from "next/navigation";

function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white text-sm font-semibold animate-fade-in ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// ==========================================
// COMPOSANT : Champ Mot de Passe Réutilisable
// ==========================================
interface PasswordInputProps {
  placeholder?: string;
  id?: string;
  required?: boolean;
}

function PasswordInput({ placeholder = "Mot de passe", id = "password", required = true }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center w-full">
      <span className="absolute left-3 text-blue-500 pointer-events-none">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path fill="currentColor" d="M17 11V7a5 5 0 1 0-10 0v4H5v10h14V11h-2ZM9 7a3 3 0 1 1 6 0v4H9V7Zm8 6v6H7v-6h10Zm-5 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>
        </svg>
      </span>
      
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="pl-10 pr-10 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full text-sm"
        required={required}
      />
      
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-3 text-zinc-400 hover:text-blue-500 focus:outline-none transition-colors"
        onClick={() => setShow((v) => !v)}
      >
        {show ? (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" d="M2 3.93L3.93 2l16.14 16.14-1.93 1.93L15.34 17.2c-1.04.5-2.2.8-3.34.8-4.42 0-8-3.13-8-6 0-1.46.92-2.82 2.4-3.87L2 3.93ZM12 8c1.66 0 3 1.34 3 3 0 .54-.15 1.05-.4 1.48l-4.08-4.08c.43-.25.94-.4 1.48-.4Zm-4.94.54C6.4 9.38 6 10.64 6 12c0 1.66 1.34 3 3 3 1.36 0 2.62-.4 3.46-1.06L7.06 8.54Z"/>
          </svg>
        ) : (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 6c-4.418 0-8 3.134-8 6s3.582 6 8 6 8-3.134 8-6-3.582-6-8-6Zm0 10c-2.21 0-4-1.343-4-3s1.79-3 4-3 4 1.343 4 3-1.79 3-4 3Zm0-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ==========================================
// COMPOSANT PRINCIPAL : Page d'authentification
// ==========================================
export default function LoginPage() {
  // Ajout de la classe login-page sur le body pour désactiver la scrollbar
  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const phone = (document.getElementById("phone") as HTMLInputElement)?.value;
    const password = (document.getElementById("password") as HTMLInputElement)?.value;

    try {
      console.log("Tentative de login avec:", phone, password);
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, password }),
      });
      const data = await res.json();
      console.log("Réponse API login:", res.status, data);
      
      if (!res.ok) {
        showToast(data.error || "Identifiants invalides", 'error');
        throw new Error(data.error || "Identifiants invalides");
      }

      localStorage.setItem("userId", data.id);
      localStorage.setItem("token", data.id);
      localStorage.setItem("name", data.name);
      showToast(data.message || "Connexion réussie", 'success');

      // Redirection vers la page d'accueil
      router.push("/home");

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Erreur de connexion");
      } else {
        setError("Erreur de connexion");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-8 flex flex-col gap-6 items-center animate-fade-in">
        
        <div className="w-24 h-24 flex items-center justify-center">
          <LuBuilding className="w-20 h-20 text-indigo-600 animate-bob" aria-hidden="true" />
        </div>
        <style jsx>{`
          .animate-bob {
            animation: bob 2.4s ease-in-out infinite;
            will-change: transform;
          }
          @keyframes bob {
            0% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0); }
          }
        `}</style>

        <div className="text-center animate-fade-in-down">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Bienvenue</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Connectez-vous à votre espace entreprise</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 animate-fade-in-up">
          {error && <div className="text-red-500 text-sm text-center animate-fade-in">{error}</div>}
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Numéro de téléphone
            </label>
            <div className="relative flex items-center w-full">
              <span className="absolute left-3 text-blue-500 pointer-events-none">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </span>
              <input
                id="phone"
                type="tel"
                placeholder="Ex: +33 6 12 34 56 78"
                className="pl-10 pr-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full text-sm"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Mot de passe
            </label>
            <PasswordInput id="password" placeholder="Entrez votre mot de passe" />
          </div>

          <button
            type="submit"
            className={`mt-2 w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-4 rounded-lg shadow-md active:scale-[0.98] transition-all duration-150 text-sm flex items-center justify-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
            ) : null}
            Se connecter
          </button>
        </form>

        <div className="text-center border-t border-zinc-100 dark:border-zinc-700 pt-4 animate-fade-in">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pas de compte ?{" "}
            <Link href="/signup" className="text-blue-500 hover:text-blue-600 font-medium hover:underline transition-all duration-200">
              Créer un compte
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}