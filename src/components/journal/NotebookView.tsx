import { motion } from "framer-motion";
import { BookOpen, Mic, Pencil, Camera, Clock } from "lucide-react";

export type NotebookEntry = {
  id: string;
  text: string;
  mode: "text" | "voice" | "draw" | "photo";
  timestamp: string;
  date: string;
};

const modeIcons = { text: BookOpen, voice: Mic, draw: Pencil, photo: Camera };

const mockEntries: NotebookEntry[] = [
  { id: "1", text: "Felt overwhelmed after the sprint retro. Too many action items piling up and no clarity on priorities.", mode: "text", timestamp: "2:30 PM", date: "Today" },
  { id: "2", text: "Voice note: Talked through my frustration about the deployment failure. Feeling a bit lighter now.", mode: "voice", timestamp: "10:15 AM", date: "Today" },
  { id: "3", text: "Drew a tangled web — that's how my thoughts feel right now. Everything is connected but nothing makes sense.", mode: "draw", timestamp: "9:00 PM", date: "Yesterday" },
  { id: "4", text: "Had a good walk at lunch. Noticed the trees changing colour. Small moment of calm in a chaotic day.", mode: "text", timestamp: "1:45 PM", date: "Yesterday" },
  { id: "5", text: "Photographed my desk setup after cleaning it. Fresh start energy.", mode: "photo", timestamp: "8:00 AM", date: "2 days ago" },
];

export default function NotebookView() {
  const grouped = mockEntries.reduce<Record<string, NotebookEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <BookOpen className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide font-medium">Your Private Notebook</span>
      </div>

      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date} className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{date}</h3>
          {entries.map((entry, i) => {
            const Icon = modeIcons[entry.mode];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-soft transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">{entry.text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                      <span className="text-xs text-muted-foreground capitalize">• {entry.mode}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
