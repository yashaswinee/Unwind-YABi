import { motion } from "framer-motion";
import { MessageCircle, Clock, ArrowRight } from "lucide-react";

export type ChatSession = {
  id: string;
  preview: string;
  timestamp: string;
  messageCount: number;
};

const mockSessions: ChatSession[] = [
  { id: "s1", preview: "Talked about feeling coded into a corner after the sprint…", timestamp: "2 hours ago", messageCount: 8 },
  { id: "s2", preview: "Explored Sunday evening anxiety and the pattern before sprint weeks…", timestamp: "Yesterday", messageCount: 14 },
  { id: "s3", preview: "Discussed imposter syndrome after the code review feedback…", timestamp: "3 days ago", messageCount: 6 },
];

interface ChatHistoryProps {
  onResume: (sessionId: string) => void;
}

export default function ChatHistory({ onResume }: ChatHistoryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide font-medium">Continue a conversation</span>
      </div>

      {mockSessions.map((session, i) => (
        <motion.button
          key={session.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onResume(session.id)}
          className="w-full text-left bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-soft hover:border-primary/30 transition-all group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground line-clamp-2">{session.preview}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{session.timestamp}</span>
                </div>
                <span className="text-xs text-muted-foreground">{session.messageCount} messages</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0" />
          </div>
        </motion.button>
      ))}
    </div>
  );
}
