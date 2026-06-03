"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

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
      {/* Icône cadenas */}
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
      
      {/* Bouton pour afficher/masquer le mot de passe */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-3 text-zinc-400 hover:text-blue-500 focus:outline-none transition-colors"
        onClick={() => setShow((v) => !v)}
      >
        {show ? (
          /* Icône œil barré */
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" d="M2 3.93L3.93 2l16.14 16.14-1.93 1.93L15.34 17.2c-1.04.5-2.2.8-3.34.8-4.42 0-8-3.13-8-6 0-1.46.92-2.82 2.4-3.87L2 3.93ZM12 8c1.66 0 3 1.34 3 3 0 .54-.15 1.05-.4 1.48l-4.08-4.08c.43-.25.94-.4 1.48-.4Zm-4.94.54C6.4 9.38 6 10.64 6 12c0 1.66 1.34 3 3 3 1.36 0 2.62-.4 3.46-1.06L7.06 8.54Z"/>
          </svg>
        ) : (
          /* Icône œil */
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 6c-4.418 0-8 3.134-8 6s3.582 6 8 6 8-3.134 8-6-3.582-6-8-6Zm0 10c-2.21 0-4-1.343-4-3s1.79-3 4-3 4 1.343 4 3-1.79 3-4 3Zm0-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ==========================================
// COMPOSANT PRINCIPAL : Page d'inscription
// ==========================================
export default function SignupPage() {
  // Ajout de la classe signup-page sur le body pour désactiver la scrollbar
  useEffect(() => {
    document.body.classList.add("signup-page");
    return () => document.body.classList.remove("signup-page");
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const phone = (document.getElementById("company-phone") as HTMLInputElement)?.value;
    const password = (document.getElementById("signup-password") as HTMLInputElement)?.value;
    const name = "Entreprise";

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, password, name }),
      });

      // PROTECTION CRUCIALE : Éviter le crash si le serveur renvoie du HTML (Erreur 404/500 de Next)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Le serveur a retourné une réponse invalide (Code ${res.status}). L'API n'est probablement pas configurée à cette adresse.`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      // Stocker le token et les infos comme dans le login
      localStorage.setItem("userId", data.id);
      localStorage.setItem("token", data.id);
      localStorage.setItem("name", data.name);

      // Redirection vers home
      window.location.href = "/home";
    } catch (err) {
      setError((err as Error).message || "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col gap-6 items-center">
        
        {/* Conteneur Logo */}
        <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 via-blue-300 to-blue-600 p-1 shadow-md hover:scale-105 transition-transform duration-300">
          <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 overflow-hidden relative flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="Logo entreprise" 
              width={80} 
              height={80} 
              priority 
              className="object-contain" 
            />
          </div>
        </div>

        {/* Titre */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Créer un compte</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Inscrivez votre entreprise dès aujourd&apos;hui</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          
          {/* Bloc d'affichage de l'erreur */}
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900/50 transition-all">
              {error}
            </div>
          )}
          
          {/* Champ Téléphone */}
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="company-phone" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Numéro de l&apos;entreprise
            </label>
            <div className="relative flex items-center w-full">
              <span className="absolute left-3 text-blue-500 pointer-events-none">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </span>
              <input
                id="company-phone"
                type="tel"
                placeholder="Ex: 01 23 45 67 89"
                className="pl-10 pr-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full text-sm"
                required
              />
            </div>
          </div>

          {/* Champ Mot de passe */}
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="signup-password" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Définir un mot de passe
            </label>
            <PasswordInput id="signup-password" placeholder="Minimum 8 caractères" />
          </div>

          {/* Bouton de validation avec Spinner */}
          <button
            type="submit"
            className={`mt-2 w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md active:scale-[0.98] transition-all duration-150 text-sm flex items-center justify-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading && (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
            )}
            {loading ? "Inscription en cours..." : "S'inscrire"}
          </button>
        </form>

        {/* Lien de redirection vers connexion */}
        <div className="w-full text-center border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-blue-500 hover:text-blue-600 font-medium hover:underline transition-all duration-200">
              Se connecter
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}