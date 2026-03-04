import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Lightbulb, ArrowRight, Loader2, Leaf, Shield, Users, Gavel } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Suggestion {
  category: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  icon: any;
}

export function SmartSuggestions() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      category: "Conservation",
      title: "Native Species Reforestation",
      description: "Plant drought-resistant native species like Khejri and Rohida to stabilize soil and improve biodiversity.",
      impact: "High",
      icon: Leaf
    },
    {
      category: "Policy",
      title: "Strict Mining Buffer Zones",
      description: "Enforce a 1km buffer zone around protected forest areas where no commercial activity is permitted.",
      impact: "High",
      icon: Shield
    },
    {
      category: "Community",
      title: "Citizen Watch Programs",
      description: "Empower local communities with mobile tools to report illegal dumping and encroachment anonymously.",
      impact: "Medium",
      icon: Users
    }
  ]);

  const generateNewSuggestions = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          role: 'user',
          parts: [{ text: "Generate 3 innovative, actionable, and specific suggestions for conserving the Aravalli mountain range. Focus on technology, policy, and community action. Return ONLY a JSON array with keys: category, title, description, impact (High/Medium/Low)." }]
        }]
      });

      const text = response.text || '';
      // Simple parsing attempt - in production use structured output or better parsing
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        const newSuggestions = JSON.parse(jsonMatch[0]).map((s: any) => ({
          ...s,
          icon: s.category.toLowerCase().includes('policy') ? Gavel : 
                s.category.toLowerCase().includes('community') ? Users : 
                s.category.toLowerCase().includes('tech') ? Sparkles : Leaf
        }));
        setSuggestions(newSuggestions);
      }
    } catch (error) {
      console.error("Failed to generate suggestions", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
            <Sparkles className="text-emerald-600" />
            Smart AI Suggestions
          </h2>
          <p className="text-zinc-500 mt-2 max-w-2xl">
            AI-driven actionable insights for the preservation and restoration of the Aravalli ecosystem.
            Generated based on real-time satellite data and global conservation best practices.
          </p>
        </div>
        <button
          onClick={generateNewSuggestions}
          disabled={loading}
          className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Lightbulb size={18} />}
          Generate Fresh Ideas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  suggestion.category === 'Conservation' ? "bg-emerald-100 text-emerald-600" :
                  suggestion.category === 'Policy' ? "bg-blue-100 text-blue-600" :
                  "bg-purple-100 text-purple-600"
                )}>
                  <Icon size={24} />
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border",
                  suggestion.impact === 'High' ? "bg-red-50 text-red-700 border-red-200" :
                  suggestion.impact === 'Medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-zinc-50 text-zinc-700 border-zinc-200"
                )}>
                  {suggestion.impact} Impact
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">
                {suggestion.title}
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed mb-4">
                {suggestion.description}
              </p>
              
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <span>{suggestion.category}</span>
                <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                <span className="flex items-center gap-1 text-emerald-600 cursor-pointer hover:underline">
                  Action Plan <ArrowRight size={12} />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
