'use client';

import { useState, useRef, useEffect } from 'react';
import { useGeminiChat } from '../app/hooks/useGeminiChat';
import { Send, Loader2, X, MessageCircle, Bot, User, FileText, Download, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const { messages, sendMessage, isLoading, clearMessages } = useGeminiChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const suggestions = [
    "Comment ajouter un produit au stock?",
    "Comment créer une vente?",
    "Comment générer un rapport?",
    "Comment vérifier les alertes stock?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen && messages.length > 1) setHasNewMessage(true);
  }, [messages, isOpen]);

  const sendMessageWithHistory = (userMessage: string) => {
    const history = messages
      .filter(m => m.sender === 'user' || m.sender === 'bot')
      .map(m => ({ sender: m.sender, text: m.text }));
    sendMessage(userMessage, history);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() === '' || isLoading) return;
    sendMessageWithHistory(inputMessage);
    setInputMessage('');
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessageWithHistory(suggestion);
  };

  const openChat = () => {
    setIsOpen(true);
    setHasNewMessage(false);
  };

  return (
    <div className="print-hide">
      {/* Bouton flottant */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', damping: 15 }}
            onClick={openChat}
            className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-full p-3 sm:p-4 shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 group active:scale-95"
          >
            <MessageCircle size={22} className="sm:w-6 sm:h-6 group-hover:scale-110 transition" />
            {!isOpen && hasNewMessage && (
              <>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Boîte de chat - RESPONSIVE PARFAIT */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`
                fixed z-50 flex flex-col overflow-hidden
                bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-2xl
                border border-white/20 dark:border-zinc-700/50
                /* Centré sur tous les écrans */
                top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                /* MOBILE : taille adaptée */
                w-[92%] max-w-[400px] h-[80dvh] rounded-2xl
                /* TABLETTE : plus grand */
                sm:w-[500px] sm:h-[85dvh]
                /* DESKTOP : taille réduite et bien centré */
                lg:w-[420px] lg:h-[580px]
              `}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-3 sm:p-5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-lg">
                        Assistant DG Business
                      </h3>
                      <p className="text-[10px] sm:text-xs text-indigo-100">Disponible 24/7</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={clearMessages} 
                      title="Nouvelle conversation"
                      className="p-2 hover:bg-white/20 rounded-xl transition"
                    >
                      <RotateCcw size={18} className="sm:w-5 sm:h-5" />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition">
                      <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages avec scrollbar stylisé */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-zinc-800 dark:to-zinc-900 chat-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-4 rounded-full">
                      <Bot className="w-12 h-12 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Bienvenue!</p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
                        Je peux vous aider avec la gestion de votre stock, ventes, dépenses, dettes, rapports et bien plus!
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {suggestions.map((sug) => (
                        <button
                          key={sug}
                          onClick={() => handleSuggestion(sug)}
                          className="text-xs sm:text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full px-3 py-1.5 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx === messages.length - 1 ? 0.1 : 0 }}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          {msg.sender === 'bot' && (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                            </div>
                          )}
                          {msg.sender === 'user' && (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                            </div>
                          )}
                          <div
                            className={`p-3 rounded-2xl shadow-sm text-sm sm:text-base ${
                              msg.sender === 'user'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                                : 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-gray-100 rounded-bl-md'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-100' : 'text-gray-400'}`}>
                              {msg.timestamp instanceof Date
                                ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-3 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                          <span className="text-sm text-gray-500">Réflexion en cours...</span>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Suggestions rapides si historique */}
              {messages.length > 0 && !isLoading && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-200 dark:border-zinc-700 flex flex-wrap gap-1.5 overflow-x-auto shrink-0">
                  {suggestions.slice(0, 3).map((sug) => (
                    <button
                      key={sug}
                      onClick={() => handleSuggestion(sug)}
                      className="text-[10px] sm:text-xs whitespace-nowrap px-2.5 py-1 bg-white dark:bg-zinc-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Posez votre question..."
                  disabled={isLoading}
                  className="flex-1 bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                />
                <motion.button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl p-2.5 sm:p-2.5 transition shadow-md"
                >
                  {isLoading ? <Loader2 size={16} className="sm:w-5 sm:h-5 animate-spin" /> : <Send size={16} className="sm:w-5 sm:h-5" />}
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}