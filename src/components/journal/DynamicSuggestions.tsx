import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wind, Brain, Timer, TreePine, Shuffle, Coffee } from "lucide-react";
import { useEffect, useState } from "react";

export type Suggestion = {
  icon: typeof Wind;
  label: string;
  description: string;
  color: string;
};

const contextualSuggestions: Record<string, Suggestion[]> = {
  stress: [
    { icon: Wind, label: "Box Breathing", description: "4s inhale · 4s hold · 4s exhale · 4s hold", color: "bg-accent text-accent-foreground" },
    { icon: Brain, label: "Grounding 5-4-3-2-1", description: "Write what you notice in each step", color: "bg-warm text-warm-foreground" },
  ],
  deadline: [
    { icon: Timer, label: "Mental Refactor", description: "Break your biggest worry into 3 small, solvable pieces", color: "bg-accent text-accent-foreground" },
    { icon: Coffee, label: "Strategic Pause", description: "5-min break with a specific re-entry plan", color: "bg-warm text-warm-foreground" },
  ],
  isolation: [
    { icon: TreePine, label: "Connection Check", description: "Text someone you trust — even just 'hey'", color: "bg-calm text-calm-foreground" },
    { icon: Shuffle, label: "Perspective Shift", description: "Write your situation as if advising a friend", color: "bg-accent text-accent-foreground" },
  ],
  default: [
    { icon: Wind, label: "Box Breathing", description: "4s inhale · 4s hold · 4s exhale · 4s hold", color: "bg-accent text-accent-foreground" },
    { icon: Brain, label: "Grounding 5-4-3-2-1", description: "Write what you notice in each step", color: "bg-warm text-warm-foreground" },
  ],
};

const NEGATION_WORDS = "(?:no|not|never|without|hardly|barely|isn't|isnt|aren't|arent|wasn't|wasnt|weren't|werent|don't|dont|didn't|didnt|can't|cant|won't|wont|shouldn't|shouldnt|couldn't|couldnt)";

function isNegatedMatch(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${NEGATION_WORDS}\\b(?:\\W+\\w+){0,3}\\W+${escaped}\\b`, "i");
  return regex.test(text);
}

function hasStressSignal(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    "stress",
    "stressed",
    "anxiety",
    "anxious",
    "panic",
    "panicking",
    "worried",
    "worry",
    "tense",
    "restless",
    "overthinking",
    "nervous",
    "fear",
    "fearful",
    "work pressure",
    "workload",
    "deadline",
    "pressure",
    "overwhelm",
    "overwhelmed",
    "rush",
    "urgent",
  ];

  return keywords.some((keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const direct = new RegExp(`\\b${escaped}\\b`, "i");
    return direct.test(lower) && !isNegatedMatch(lower, keyword);
  });
}

function detectContext(text: string): string {
  const lower = text.toLowerCase();
  if (hasStressSignal(lower)) return "stress";
  if (lower.match(/deadline|pressure|sprint|rush|urgent|overwhelm/)) return "deadline";
  if (lower.match(/alone|isolat|nobody|lonely|disconnect/)) return "isolation";
  return "default";
}

interface DynamicSuggestionsProps {
  latestUserMessage: string;
}

const BOX_BREATHING_LABEL = "Box Breathing";
const GROUNDING_LABEL = "Grounding 5-4-3-2-1";

const breathingPhases = [
  { label: "Breathe In", seconds: 4 },
  { label: "Hold", seconds: 4 },
  { label: "Breathe Out", seconds: 4 },
  { label: "Hold", seconds: 4 },
];

const groundingSteps = [5, 4, 3, 2, 1] as const;
const groundingActions: Record<number, string> = {
  5: "things you can see",
  4: "things you can touch",
  3: "things you can hear",
  2: "things you can smell",
  1: "thing you can taste",
};

export default function DynamicSuggestions({ latestUserMessage }: DynamicSuggestionsProps) {
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const [isBreathing, setIsBreathing] = useState(false);
  const [isGroundingSubmitted, setIsGroundingSubmitted] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(breathingPhases[0].seconds);
  const [groundingAnswers, setGroundingAnswers] = useState<Record<string, string[]>>({
    "5": Array(5).fill(""),
    "4": Array(4).fill(""),
    "3": Array(3).fill(""),
    "2": Array(2).fill(""),
    "1": Array(1).fill(""),
  });

  const context = detectContext(latestUserMessage || "");
  const suggestions = contextualSuggestions[context] || contextualSuggestions.default;

  useEffect(() => {
    if (context === "stress" && latestUserMessage.trim()) {
      setActiveSuggestion(BOX_BREATHING_LABEL);
    }
  }, [context, latestUserMessage]);

  useEffect(() => {
    if (activeSuggestion !== BOX_BREATHING_LABEL) {
      setIsBreathing(false);
      setPhaseIndex(0);
      setSecondsLeft(breathingPhases[0].seconds);
    }
  }, [activeSuggestion]);

  useEffect(() => {
    if (!isBreathing || activeSuggestion !== BOX_BREATHING_LABEL) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        setPhaseIndex((current) => {
          const next = (current + 1) % breathingPhases.length;
          setSecondsLeft(breathingPhases[next].seconds);
          return next;
        });

        return 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isBreathing, activeSuggestion]);

  const updateGroundingAnswer = (step: number, index: number, value: string) => {
    const key = String(step);
    setGroundingAnswers((prev) => {
      const next = [...(prev[key] || [])];
      next[index] = value;
      return { ...prev, [key]: next };
    });
  };

  const resetGroundingAnswers = () => {
    setGroundingAnswers({
      "5": Array(5).fill(""),
      "4": Array(4).fill(""),
      "3": Array(3).fill(""),
      "2": Array(2).fill(""),
      "1": Array(1).fill(""),
    });
  };

  const handleGroundingSubmit = () => {
    setIsGroundingSubmitted(true);
    resetGroundingAnswers();

    window.setTimeout(() => {
      setActiveSuggestion(null);
      setIsGroundingSubmitted(false);
    }, 700);
  };

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
            onClick={() => {
              setActiveSuggestion(activeSuggestion === item.label ? null : item.label);
            }}
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
              {activeSuggestion === BOX_BREATHING_LABEL ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-primary/20 animate-breathe flex items-center justify-center">
                    <span className="text-primary font-serif text-lg text-center leading-tight">
                      {breathingPhases[phaseIndex].label}
                    </span>
                  </div>
                  <p className="text-accent-foreground text-sm text-center">
                    4s inhale · 4s hold · 4s exhale · 4s hold
                  </p>
                  <button
                    onClick={() => setIsBreathing((prev) => !prev)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    {isBreathing ? "Stop" : "Start"}
                  </button>
                </>
              ) : activeSuggestion === GROUNDING_LABEL ? (
                <div className="w-full space-y-3">
                  <p className="text-accent-foreground text-sm text-center font-medium">
                    Fill one line per item.
                  </p>
                  {groundingSteps.map((step) => (
                    <div key={step} className="space-y-2">
                      <p className="text-xs text-accent-foreground/80">
                        {step} {groundingActions[step]}
                      </p>
                      <div className="grid gap-2">
                        {Array.from({ length: step }).map((_, index) => (
                          <input
                            key={`${step}-${index}`}
                            value={groundingAnswers[String(step)][index] || ""}
                            onChange={(e) => updateGroundingAnswer(step, index, e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder={`${step}.${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={handleGroundingSubmit}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      {isGroundingSubmitted ? "Submitted" : "Submit"}
                    </button>
                  </div>
                </div>
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
