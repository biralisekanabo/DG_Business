"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LuBuilding, LuLogOut, LuShield, LuSparkles } from "react-icons/lu";

export default function HomePage() {
  // Ajout de la classe home-page sur le body pour désactiver la scrollbar
  useEffect(() => {
    document.body.classList.add("home-page");
    return () => document.body.classList.remove("home-page");
  }, []);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [screenSize, setScreenSize] = useState("desktop");

  useEffect(() => {
    let token: string | null = null;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        token = localStorage.getItem("token");
      }
    } catch (e) {
      console.error("Erreur localStorage:", e);
    }

    if (!token) {
      router.push("/login");
    } else {
      setIsLoading(false);
    }

    // Update screen size on resize
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize("mobile");
      else if (width < 768) setScreenSize("tablet");
      else setScreenSize("desktop");
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
        <div className="relative">
          <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 border-4 border-transparent border-t-white/40 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/30 via-indigo-200/20 to-purple-200/30 animate-gradient-xy"></div>

      {/* Floating orbs - responsive sizes */}
      <div className="absolute top-5 xs:top-8 sm:top-10 left-5 xs:left-8 sm:left-10 w-40 xs:w-56 sm:w-72 h-40 xs:h-56 sm:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow"></div>
      <div className="absolute bottom-5 xs:bottom-8 sm:bottom-10 right-5 xs:right-8 sm:right-10 w-40 xs:w-56 sm:w-80 h-40 xs:h-56 sm:h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slower"></div>
      <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 xs:w-80 sm:w-96 h-72 xs:h-80 sm:h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow"></div>

      {/* Small decorative particles - hidden on very small screens */}
      <div className="absolute inset-0 pointer-events-none hidden xs:block">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400 rounded-full opacity-30 animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Logout button - top right, responsive */}
      <div className="absolute top-2 xs:top-3 sm:top-4 md:top-6 right-2 xs:right-3 sm:right-4 md:right-6 z-20">
        <button
          onClick={handleLogout}
          className="group flex items-center gap-1 xs:gap-2 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm text-gray-700 text-xs xs:text-sm font-medium hover:bg-white/60 hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <LuLogOut className="w-3 h-3 xs:w-4 xs:h-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden xs:inline">Déconnexion</span>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-3 xs:px-4 sm:px-6 md:px-8 py-6 xs:py-8 sm:py-12">
        {/* Animated icon card - fully responsive */}
        <div className="mb-6 xs:mb-8 sm:mb-10 md:mb-12 lg:mb-16 animate-float">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl xs:rounded-3xl blur-lg xs:blur-xl opacity-70 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-white/50 backdrop-blur-xl p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 rounded-2xl xs:rounded-3xl shadow-2xl border border-white/60">
              <LuBuilding 
                className="w-16 h-16 xs:w-20 xs:h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 text-indigo-600 drop-shadow-md" 
                strokeWidth={1.2} 
              />
            </div>
          </div>
        </div>

        {/* Text content with glass card effect - fully responsive */}
        <div className="w-full max-w-4xl text-center space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 animate-fade-up px-2">
          <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-gray-800 via-indigo-700 to-purple-800 bg-clip-text text-transparent drop-shadow-sm leading-tight">
            Gestion d'Entreprise
          </h1>

          <div className="inline-block mx-auto backdrop-blur-sm bg-white/30 px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-full border border-white/50">
            <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 font-light">
              Développez, organisez et gérez votre entreprise facilement.
            </p>
          </div>

          {/* CTA button - fully responsive */}
          <div className="pt-3 xs:pt-4 sm:pt-6 md:pt-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="group inline-flex items-center gap-1.5 xs:gap-2 px-4 xs:px-5 sm:px-6 md:px-8 py-2 xs:py-2.5 sm:py-3 md:py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs xs:text-sm sm:text-base md:text-lg font-semibold shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <LuSparkles className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              <span>Tableau de bord</span>
            </button>
          </div>
        </div>

        {/* Security badge - bottom, responsive */}
        <div className="absolute bottom-3 xs:bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10 px-2">
          <div className="flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 sm:px-5 py-1.5 xs:py-2 sm:py-3 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-sm">
            <LuShield className="w-3 h-3 xs:w-4 xs:h-4 text-emerald-500 flex-shrink-0" />
            <span className="text-xs xs:text-sm text-gray-600 font-medium whitespace-nowrap">
              Sécurisé
            </span>
          </div>
        </div>
      </div>

      {/* Custom animations and responsive styles */}
      <style>{`
        html, body {
          overflow: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          width: 100%;
          height: 100%;
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar {
          display: none;
        }

        /* Responsive breakpoints support */
        @supports (width: 100vw) {
          body {
            width: 100vw;
            height: 100vh;
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.1); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 30px) scale(1.2); }
        }
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.05); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 18s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 22s ease-in-out infinite;
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 12s ease infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-fade-up {
          animation: fade-up 0.8s ease-out forwards;
        }
        .animate-twinkle {
          animation: twinkle 4s ease-in-out infinite;
        }

        /* Mobile-first responsive design */
        @media (max-width: 639px) {
          body, html {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}