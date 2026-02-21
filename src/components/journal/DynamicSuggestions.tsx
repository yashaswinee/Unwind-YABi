import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wind, Brain, Timer, TreePine, Shuffle, Coffee } from "lucide-react";
import { useState } from "react";

export type Suggestion = {
  icon: typeof Wind;
  label: string;
  description: string;
  color: string;
};

const contextualSuggestions: Record<string, Suggestion[]> = {
  deadline: [
    { icon: Timer, label: "Mental Refactor", description: "Break your biggest worry into 3 small, solvable pieces", color: "bg-accent text-accent-foreground" },
    { icon: Coffee, label: "Strategic Pause", description: "5-min break with a specific re-entry plan", color: "bg-warm text-warm-foreground" },
  ],
  isolation: [
    { icon: TreePine, label: "Connection Check", description: "Text someone you trust — even just 'hey'", color: "bg-calm text-calm-foreground" },
    { icon: Shuffle, label: "Perspective Shift", description: "Write your situation as if advising a friend", color: "bg-accent text-accent-foreground" },
  ],
  default: [
    { icon: Wind, label: "4-7-8 Breathing", description: "Inhale 4s · Hold 7s · Exhale 8s", color: "bg-accent text-accent-foreground" },
    { icon: Brain, label: "Grounding 5-4-3-2-1", description: "Notice 5 things you can see, 4 you can touch…", color: "bg-warm text-warm-foreground" },
  ],
};

function detectContext(text: string): string {
  const lower = text.toLowerCase();
  if (lower.match(/deadline|pressure|sprint|rush|urgent|overwhelm/)) return "deadline";
  if (lower.match(/alone|isolat|nobody|lonely|disconnect/)) return "isolation";
  return "default";
}

interface DynamicSuggestionsProps {
  journalContent: string;
}

export default function DynamicSuggestions({ journalContent }: DynamicSuggestionsProps) {
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const context = detectContext(journalContent);
  const suggestions = contextualSuggestions[context] || contextualSuggestions.default;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {context !== "default" ? "Suggested for You" : "Quick Relief"}
        </h2>
      </div>

      <div className="flex gap-3">
        {suggestions.map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveSuggestion(activeSuggestion === item.label ? null : item.label)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${item.color} transition-all hover:scale-[1.02] active:scale-[0.98]`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {activeSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-accent rounded-2xl p-6 flex flex-col items-center gap-4">
              {activeSuggestion === "4-7-8 Breathing" ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-primary/20 animate-breathe flex items-center justify-center">
                    <span className="text-primary font-serif text-lg">Breathe</span>
                  </div>
                  <p className="text-accent-foreground text-sm text-center">
                    Inhale 4s · Hold 7s · Exhale 8s
                  </p>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-accent-foreground text-sm font-medium">
                    {suggestions.find((s) => s.label === activeSuggestion)?.description}
                  </p>
                  <p className="text-accent-foreground/70 text-xs">
                    Take a moment. There's no rush.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
