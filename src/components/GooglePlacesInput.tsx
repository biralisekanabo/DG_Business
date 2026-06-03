'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LuMapPin, LuX } from 'react-icons/lu';

declare global {
  interface Window {
    google: any;
  }
}

interface GooglePlacesInputProps {
  value: string;
  onChange: (address: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
}

export default function GooglePlacesInput({
  value,
  onChange,
  placeholder = 'Entrez votre adresse...',
  className = '',
}: GooglePlacesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocompleteService, setAutocompleteService] = useState<any>(null);
  const [placesService, setPlacesService] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialiser Google Maps API
  useEffect(() => {
    // Vérifier si l'API est déjà chargée
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      const service = new window.google.maps.places.AutocompleteService();
      setAutocompleteService(service);
      const placesService = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
      setPlacesService(placesService);
      return;
    }

    // Charger le script si nécessaire
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps?.places) {
        const service = new window.google.maps.places.AutocompleteService();
        setAutocompleteService(service);
        const placesService = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        setPlacesService(placesService);
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    onChange(input);

    if (!input || input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!autocompleteService) return;

    setIsLoading(true);
    try {
      const response = await autocompleteService.getPlacePredictions({
        input,
        componentRestrictions: { country: 'cd' }, // République Démocratique du Congo
      });

      setSuggestions(response.predictions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Erreur autocomplete:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    if (!placesService || !suggestion.place_id) return;

    // Récupérer les détails complets du lieu
    placesService.getDetails({ placeId: suggestion.place_id }, (place: any, status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const address = place.formatted_address || suggestion.description;
        const details = {
          address,
          lat: place.geometry?.location?.lat?.(),
          lng: place.geometry?.location?.lng?.(),
          placeId: suggestion.place_id,
          components: place.address_components,
        };

        onChange(address, details);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    });
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <LuMapPin
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value && setSuggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-9 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition ${className}`}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
          >
            <LuX size={16} />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-zinc-700 transition text-zinc-900 dark:text-white text-sm border-b border-zinc-200 dark:border-zinc-700 last:border-b-0 flex items-start gap-3"
            >
              <LuMapPin size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-zinc-900 dark:text-white">
                  {suggestion.main_text}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                  {suggestion.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg p-3 text-center text-xs text-gray-400">
          Recherche en cours...
        </div>
      )}
    </div>
  );
}
