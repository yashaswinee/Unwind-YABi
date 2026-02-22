import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

type Session = {
  session_id: string;
  title: string;
  created_at: string;
  messages: { role: string; text: string }[];
};

export default function ChatHistory({
  onResume,
}: {
  onResume: (sessionId: string) => void;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/messages")
      .then((res) => res.json())
      .then((data) => {
        const formatted: Session[] = Object.entries(data).map(
          ([session_id, value]: any) => {
            const date = new Date(value.created_at);
            const day = date.getDate();
            const month = date.toLocaleString('default', { month: 'long' });

            return {
              session_id,
              title: value.title || `${day} ${month}`,
              created_at: value.created_at,
              messages: value.messages || [],
            };
          }
        );

        // Sort newest first
        formatted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        setSessions(formatted);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading conversations...</p>;
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No past conversations found.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide font-medium">
          Continue a conversation
        </span>
      </div>

      {sessions.map((session) => (
        <div
          key={session.session_id}
          onClick={() => onResume(session.session_id)}
          className="p-4 rounded-xl border border-border bg-card cursor-pointer hover:shadow-md transition-all"
        >
          <h3 className="text-sm font-semibold">
            {session.title}
          </h3>

          <p className="text-xs text-muted-foreground mt-1">
            {new Date(session.created_at).toLocaleDateString()} •{" "}
            {session.messages.length} messages
          </p>
        </div>
      ))}
    </div>
  );
}