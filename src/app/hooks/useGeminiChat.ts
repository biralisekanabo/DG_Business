import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export function useGeminiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      sender: 'bot',
      text: 'Salut! Je suis votre assistant DG Business.\n\nJe peux vous aider avec: Stock, Ventes, Dépenses, Dettes, Rapports et Dashboard.\n\nQu\'est-ce que vous besoin?',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userMessage: string, history?: any[]) => {
    if (!userMessage.trim()) return;

    // Add user message to the chat
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Préparer l'historique à envoyer
      const chatHistory = (history || messages).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.response || 'Désolé, je n\'ai pas pu traiter votre demande.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        sender: 'bot',
        text: 'Oups! Une erreur est survenue. Veuillez réessayer. Si le problème persiste, vérifiez votre connexion internet.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: '0',
        sender: 'bot',
        text: 'Bienvenue! Je suis votre assistant DG Business. Je peux vous aider avec:\n\nStock - Gérer votre inventaire\nVentes - Enregistrer vos transactions\nDépenses - Suivre vos charges\nDettes - Gérer vos crédits\nRapports - Générer des rapports signés\nDashboard - Comprendre vos KPIs\n\nPosez-moi n\'importe quelle question!',
        timestamp: new Date(),
      }
    ]);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    clearMessages,
  };
}
