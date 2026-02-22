import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Pencil, Type, Camera, MessageCircle, Volume2, VolumeX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import NotebookView from "@/components/journal/NotebookView";
import ChatHistory from "@/components/journal/ChatHistory";
import DynamicSuggestions from "@/components/journal/DynamicSuggestions";
import { getGeminiResponse } from "./Gemini_api";

type InputMode = "text" | "voice" | "draw" | "photo";
type AiMode = "quiet" | "active";
type View = "chat" | "notebook" | "history";

type ChatMessage = { role: "ai" | "user"; text: string };

export type JournalLog = {
  date: string;
  time: string;   
  text: string;   
};

const JOURNAL_LOGS_KEY = "journal_user_logs";

function loadLogs(): JournalLog[] {
  try {
    const raw = localStorage.getItem(JOURNAL_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLog(log: JournalLog) {
  const logs = loadLogs();
  logs.push(log);
  localStorage.setItem(JOURNAL_LOGS_KEY, JSON.stringify(logs));
}

function exportLogsAsCSV() {
  const logs = loadLogs();
  if (logs.length === 0) return;

  const header = "Date,Time,Message";
  const rows = logs.map(
    (log) => `${log.date},${log.time},"${log.text.replace(/"/g, '""')}"`
  );
  const csv = [header, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `journal_logs_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const aiMessages: ChatMessage[] = [
  { role: "ai", text: "Hey, welcome back. How are you feeling today?" },
];

export default function Journal() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [aiMode, setAiMode] = useState<AiMode>("active");
  const [entry, setEntry] = useState("");
  const [messages, setMessages] = useState(aiMessages);
  const [view, setView] = useState<View>("chat");
  const [journalLogs, setJournalLogs] = useState<JournalLog[]>([]);
  const [sessionId] = useState<string>(
    () => localStorage.getItem("journal_session_id") || crypto.randomUUID()
  );

  // Persist session id so it survives page reloads
  useEffect(() => {
    localStorage.setItem("journal_session_id", sessionId);
  }, [sessionId]);

  const inputModes: { mode: InputMode; icon: typeof Type; label: string }[] = [
    { mode: "text", icon: Type, label: "Write" },
    { mode: "voice", icon: Mic, label: "Talk" },
    { mode: "draw", icon: Pencil, label: "Draw" },
    { mode: "photo", icon: Camera, label: "Photo" },
  ];

  useEffect(() => {
    // Load previous journal logs from localStorage
    setJournalLogs(loadLogs());

    getGeminiResponse("Give a short, warm motivational greeting for someone journaling about their mental health well-being. Keep it to 1-2 sentences.")
      .then((text) => {
        setMessages([{ role: "ai", text }]);
      })
      .catch(() => {
        setMessages([
          { role: "ai", text: "Hey, welcome back. How are you feeling today?" },
        ]);
      });
  }, []);
  

  const handleSend = async () => {
    if (!entry.trim()) return;
    const userMessage = entry;

    // Log the user's message with date and time
    const now = new Date();
    const log: JournalLog = {
      date: now.toLocaleDateString("en-CA"),               // "2026-02-22"
      time: now.toLocaleTimeString("en-GB", { hour12: false }), // "14:35:07"
      text: userMessage,
    };
    saveLog(log);
    setJournalLogs((prev) => [...prev, log]);

    // Persist to backend
    fetch("http://localhost:5000/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        user_text: userMessage,
      }),
    }).catch((err) => console.warn("Backend save failed:", err));

    setMessages((prev) => [...prev, { role: "user" as const, text: userMessage }]);
    setEntry("");

    try {
      const aiText = await getGeminiResponse(
        "You are a compassionate and empathetic mental health journal companion. The user said: \"" +
        userMessage +
        "\". Respond with a thoughtful, supportive, and brief reply (2-3 sentences). Acknowledge their feelings, ask a gentle follow-up question if appropriate, and maintain a warm conversational tone."
      );
      setMessages((prev) => [...prev, { role: "ai" as const, text: aiText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai" as const,
          text: "I hear you. It sounds like there's a lot on your mind today. Can you tell me more about what's weighing on you the most?",
        },
      ]);
    }
  };

  const handleResumeChat = (sessionId: string) => {
    // Mock: load a previous session's messages
    setMessages([
      { role: "ai", text: "Welcome back. Last time we talked about feeling overwhelmed after your sprint. How have things been since then?" },
      { role: "user", text: "Still tough. The workload hasn't changed much." },
      { role: "ai", text: "That's hard. When you say the workload hasn't changed — is it the volume, or the emotional weight of the tasks?" },
    ]);
    setView("chat");
    setAiMode("active");
  };

  const handleStartNewChat = () => {
    setMessages(aiMessages);
    setView("chat");
    setAiMode("active");
  };

  // When switching to quiet mode, show notebook
  const toggleAiMode = () => {
    if (aiMode === "active") {
      setAiMode("quiet");
      setView("notebook");
    } else {
      setAiMode("active");
      setView("chat");
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-foreground">Your Space</h1>
            <p className="text-sm text-muted-foreground">Express yourself, any way you want</p>
          </div>
          <button
            onClick={toggleAiMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm transition-colors hover:bg-accent"
          >
            {aiMode === "active" ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {aiMode === "active" ? "Active Resonance" : "Quiet Journal"}
          </button>
        </div>

        {/* View tabs for active mode */}
        {aiMode === "active" && (
          <div className="flex gap-2">
            <button
              onClick={() => { setView("chat"); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "chat"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
            <button
              onClick={() => setView("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "history"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Continue Chat
            </button>
          </div>
        )}

        {/* Input mode selector — shown in chat and notebook views */}
        {(view === "chat" || view === "notebook") && (
          <div className="flex gap-2">
            {inputModes.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === mode
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Main content area */}
        <AnimatePresence mode="wait">
          {view === "history" ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ChatHistory onResume={handleResumeChat} />
            </motion.div>
          ) : view === "notebook" ? (
            <motion.div
              key="notebook"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Notebook text input */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-5">
                <textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="Write in your notebook…"
                  className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[100px]"
                  rows={4}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    onClick={() => { if (entry.trim()) setEntry(""); }}
                    className="rounded-xl"
                  >
                    Save Entry
                  </Button>
                </div>
              </div>
              <NotebookView />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-card rounded-2xl border border-border shadow-card min-h-[400px] flex flex-col">
                {/* Messages */}
                <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[400px]">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-secondary-foreground rounded-bl-md"
                        }`}
                      >
                        {msg.role === "ai" && (
                          <MessageCircle className="w-3 h-3 mb-1 opacity-50 inline-block mr-1" />
                        )}
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input */}
                <div className="border-t border-border p-4">
                  {inputMode === "text" && (
                    <div className="flex gap-3">
                      <textarea
                        value={entry}
                        onChange={(e) => setEntry(e.target.value)}
                        placeholder="What's on your mind..."
                        className="flex-1 resize-none bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[56px]"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                      />
                      <Button onClick={handleSend} className="self-end rounded-xl">
                        Send
                      </Button>
                    </div>
                  )}
                  {inputMode === "voice" && (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-breathe">
                        <Mic className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Tap to start speaking</p>
                    </div>
                  )}
                  {inputMode === "draw" && (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <div className="w-full h-32 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Sketchpad — draw how you feel</p>
                      </div>
                    </div>
                  )}
                  {inputMode === "photo" && (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Camera className="w-10 h-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload a photo that captures your mood</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Suggestions */}
        <DynamicSuggestions journalContent={entry + " " + messages.map((m) => m.text).join(" ")} />
      </div>
    </AppLayout>
  );
}
