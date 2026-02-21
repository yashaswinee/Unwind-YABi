import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, MessageCircle, Trophy, Target, ArrowRight } from "lucide-react";
import { useState } from "react";

const actionItems = [
  { id: 1, text: "Log off at 6 PM twice this week", done: true, counsellor: "Dr. Priya Sharma" },
  { id: 2, text: "Practice 4-7-8 breathing before bed", done: false, counsellor: "Dr. Priya Sharma" },
  { id: 3, text: "Write one gratitude entry this week", done: false, counsellor: "Dr. Priya Sharma" },
];

const milestones = [
  { level: 1, label: "First Check-in", unlocked: true },
  { level: 2, label: "7-Day Streak", unlocked: true },
  { level: 3, label: "First Session", unlocked: true },
  { level: 4, label: "Care Plan Started", unlocked: true },
  { level: 5, label: "3 Actions Complete", unlocked: false },
  { level: 6, label: "Mood Stabilised", unlocked: false },
];

const chatMessages = [
  { role: "counsellor" as const, text: "Great session today. Remember — those thoughts aren't facts, they're patterns we can rewire. How are you feeling about the action items?", time: "2h ago" },
  { role: "user" as const, text: "Feeling optimistic actually. The breathing exercise already helped last night.", time: "1h ago" },
  { role: "counsellor" as const, text: "That's wonderful to hear! Small wins build momentum. Keep noting how you feel before and after — we'll review together.", time: "45m ago" },
];

export default function CarePlan() {
  const [items, setItems] = useState(actionItems);

  const toggleItem = (id: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const completedCount = items.filter((i) => i.done).length;

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-serif text-foreground">Your Care Plan</h1>
          <p className="text-sm text-muted-foreground">Collaborative goals between you and your counsellor</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Action items */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-lg text-foreground">Action Items</h2>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl bg-muted hover:bg-accent transition-colors text-left"
                >
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.text}
                    </p>
                    <span className="text-xs text-muted-foreground">Assigned by {item.counsellor}</span>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="pt-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / items.length) * 100}%` }}
                  className="h-full bg-primary rounded-full"
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{completedCount}/{items.length} completed</p>
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              <h2 className="font-serif text-lg text-foreground">Milestones</h2>
            </div>
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={m.level} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      m.unlocked
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.level}
                  </div>
                  <span className={`text-sm ${m.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                    {m.label}
                  </span>
                  {m.unlocked && <CheckCircle2 className="w-4 h-4 text-success ml-auto" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Async chat */}
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h2 className="font-serif text-lg text-foreground">Async Chat with Dr. Priya Sharma</h2>
          </div>
          <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto">
            {chatMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-xs mt-1 block ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {msg.time}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Message your counsellor..."
                className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-1.5">
                Send <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
