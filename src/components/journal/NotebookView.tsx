import { motion } from "framer-motion";
import { BookOpen, Clock } from "lucide-react";
import { format } from "date-fns";

export type PassiveLogEntry = {
  sessionId: string;
  content: string;
  updated_at: string;
};

export default function NotebookView({
  passiveLogs = [],
}: {
  passiveLogs: PassiveLogEntry[];
}) {
  const grouped = passiveLogs.reduce<Record<string, PassiveLogEntry[]>>((acc, entry) => {
    let dateLabel = "Other";
    if (entry.updated_at) {
      try {
        const d = new Date(entry.updated_at);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) dateLabel = "Today";
        else if (diffDays === 1) dateLabel = "Yesterday";
        else if (diffDays < 7) dateLabel = `${diffDays} days ago`;
        else dateLabel = format(d, "MMM d, yyyy");
      } catch {
        dateLabel = "Saved";
      }
    }
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(entry);
    return acc;
  }, {});

  const order = ["Today", "Yesterday", "2 days ago", "3 days ago", "4 days ago", "5 days ago", "6 days ago"];
  const sortedDates = Object.keys(grouped).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <BookOpen className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide font-medium">Your passive logs (from database)</span>
      </div>

      {passiveLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No passive entries yet. Write above and click Save Entry — they’ll appear here.</p>
      ) : (
        sortedDates.map((dateLabel) => (
          <div key={dateLabel} className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{dateLabel}</h3>
            {grouped[dateLabel].map((entry, i) => (
              <motion.div
                key={entry.sessionId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-soft transition-shadow"
              >
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {entry.updated_at
                      ? format(new Date(entry.updated_at), "MMM d, yyyy 'at' h:mm a")
                      : "Saved"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
