import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

const SUGGESTIONS = [
  "How can I report illegal mining?",
  "What is the current NDVI trend?",
  "Explain the impact of urbanization on Aravalli.",
  "Show me recent conservation success stories."
];

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: "Hello! I'm Aravalli AI. Ask me about environmental conservation, ecological data, or how you can help protect the range." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const systemInstruction = `
        You are "Aravalli AI", an intelligent assistant for the "Aravalli Range Monitor" application. 
        Your goal is to provide information about the Aravalli mountain range, environmental conservation, ecology, and sustainability.
        
        CRITICAL MODERATION RULES:
        1. You must ONLY answer questions related to:
           - The Aravalli Range and its geography/history.
           - Environmental conservation, ecology, and biodiversity.
           - Climate change, pollution, and sustainability.
           - The data shown in this dashboard (NDVI, Nightlight, etc.).
        2. If a user asks about anything else (e.g., politics, entertainment, coding, general knowledge unrelated to nature), you must politely decline.
           - Example refusal: "I specialize in environmental monitoring for the Aravalli range. I cannot assist with that topic."
        3. Be concise, helpful, and data-driven where possible.
        4. If asked for suggestions, provide actionable conservation tips.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const modelMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response.text || "I couldn't generate a response. Please try again." 
      };
      
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "I'm having trouble connecting to the satellite network. Please check your connection.",
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all z-50",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <h3 className="font-semibold">Aravalli AI</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-emerald-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[80%] p-3 rounded-xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-emerald-600 text-white ml-auto rounded-tr-none" 
                      : "bg-white border border-zinc-200 text-zinc-800 mr-auto rounded-tl-none shadow-sm"
                  )}
                >
                  {msg.isError && <AlertTriangle size={14} className="inline mr-1 text-red-500" />}
                  {msg.text}
                </div>
              ))}
              {isLoading && (
                <div className="bg-white border border-zinc-200 p-3 rounded-xl rounded-tl-none mr-auto shadow-sm w-16 flex justify-center">
                  <Loader2 size={16} className="animate-spin text-emerald-600" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-zinc-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  placeholder="Ask about conservation..."
                  className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend(input)}
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-center text-zinc-400 mt-2">
                AI can make mistakes. Verify important info.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
