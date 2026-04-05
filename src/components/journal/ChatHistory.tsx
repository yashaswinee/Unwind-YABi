import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { getTitle } from "@/pages/Gemini_api";

type Session = {
  session_id: string;
  title: string;
  created_at: string;
  messages: { role: string; text: string }[];
};

type SessionPayload = {
  title?: string;
  created_at: string;
  messages?: { role: string; text: string }[];
};

export default function ChatHistory({
  onResume,
}: {
  onResume: (sessionId: string) => void;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      try {
        const res = await fetch("http://localhost:5000/messages");
        const data = await res.json();
        const typedData = data as Record<string, SessionPayload>;

        const formatted: Session[] = await Promise.all(
          Object.entries(typedData).map(async ([session_id, value]) => {
            const messages = value.messages || [];
            const firstUser = messages.find((m: { role: string }) => m.role === "user");
            const raw = firstUser?.text?.trim() ?? "";

            let contextTitle = value.title || "New conversation";

            if (raw) {
              try {
                contextTitle = await getTitle(raw);
              } catch {
                contextTitle = raw.length > 56 ? raw.slice(0, 56).trim() + "…" : raw;
              }
            }

            return {
              session_id,
              title: contextTitle,
              created_at: value.created_at,
              messages,
            };
          })
        );

        formatted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        if (!isMounted) {
          return;
        }

        setSessions(formatted);
        setLoading(false);
      } catch {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSessions();

    return () => {
      isMounted = false;
    };
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

      {sessions
        .filter((session) =>
          session.messages.filter((msg) => msg.role === "user").length > 0
        )
        .map((session) => (
          <div
            key={session.session_id}
            onClick={() => onResume(session.session_id)}
            className="p-4 rounded-xl border border-border bg-card cursor-pointer hover:shadow-md transition-all"
          >
            <h3 className="text-sm font-semibold text-foreground">
              {session.title}
            </h3>

            <p className="text-xs text-muted-foreground mt-1">
              {new Date(session.created_at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              • {session.messages.filter((msg) => msg.role === "user").length} messages
            </p>
          </div>
        ))}
    </div>
  );
}