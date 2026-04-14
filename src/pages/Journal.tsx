import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Pencil, Type, Camera, MessageCircle, Volume2, VolumeX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import AppLayout from "@/components/AppLayout";
import NotebookView from "@/components/journal/NotebookView";
import ChatHistory from "@/components/journal/ChatHistory";
import DynamicSuggestions from "@/components/journal/DynamicSuggestions";
import { getGeminiResponse, getTitle } from "./Gemini_api";

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
  const [isPassiveSaved, setIsPassiveSaved] = useState(false);  
  const [sessionId, setSessionId] = useState<string>(() => {
    const existing = localStorage.getItem("journal_session_id");
    if (existing) return existing;
    const newId = crypto.randomUUID();
    localStorage.setItem("journal_session_id", newId);
    return newId;
  });

  const [passiveSessionId, setPassiveSessionId] = useState<string>(() => {
    const existing = localStorage.getItem("passive_session_id");
    if (existing) return existing;
    const newId = crypto.randomUUID();
    localStorage.setItem("passive_session_id", newId);
    return newId;
  });

  const [passiveContent, setPassiveContent] = useState("");
  const [passiveLogs, setPassiveLogs] = useState<Array<{ sessionId: string; content: string; updated_at: string }>>([]);

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

  // Load chat session from database (JSON) on mount – show logs that are stored
  useEffect(() => {
    setJournalLogs(loadLogs());

    fetch(`http://localhost:5000/messages/${sessionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages?.length > 0) {
          setMessages(
            data.messages.map((m: { role: string; text: string }) => ({
              role: (m.role === "user" ? "user" : "ai") as "user" | "ai",
              text: m.text,
            }))
          );
          return;
        }
        getGeminiResponse("Give a short, warm motivational greeting for someone journaling about their mental health well-being. Keep it to 1-2 sentences.")
          .then((text) => {
            setMessages([{ role: "ai", text }]);
            saveMessageToBackend("ai", text, sessionId);
          })
          .catch(() => {
            const fallback = "Hey, welcome back. How are you feeling today?";
            setMessages([{ role: "ai", text: fallback }]);
            saveMessageToBackend("ai", fallback, sessionId);
          });
      })
      .catch(() => {
        getGeminiResponse("Give a short, warm motivational greeting for someone journaling about their mental health well-being. Keep it to 1-2 sentences.")
          .then((text) => {
            setMessages([{ role: "ai", text }]);
            saveMessageToBackend("ai", text, sessionId);
          })
          .catch(() => {
            const fallback = "Hey, welcome back. How are you feeling today?";
            setMessages([{ role: "ai", text: fallback }]);
            saveMessageToBackend("ai", fallback, sessionId);
          });
      });
  }, [sessionId]);

  // Load passive writing from database when opening notebook view
  useEffect(() => {
    if (view !== "notebook") return;
    fetch(`http://localhost:5000/passive-writing/${passiveSessionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.content) setPassiveContent(data.content);
      })
      .catch(() => {});
  }, [view, passiveSessionId]);

  const refreshPassiveLogs = () => {
    fetch("http://localhost:5000/passive-writing")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const list = Object.entries(data || {}).map(([id, val]: [string, { content?: string; updated_at?: string }]) => ({
          sessionId: id,
          content: val?.content ?? "",
          updated_at: val?.updated_at ?? "",
        }));
        setPassiveLogs(list.filter((l) => l.content.trim()));
      })
      .catch(() => {});
  };

  // Load all passive logs from database when notebook view is shown
  useEffect(() => {
    if (view === "notebook") refreshPassiveLogs();
  }, [view]);
  

  const saveMessageToBackend = (
    role: "user" | "ai",
    text: string,
    sid: string,
    title?: string
  ) => {
    fetch("http://localhost:5000/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sid,
        role,
        text,
        title,
      }),
    }).catch((err) => console.warn("Backend save failed:", err));
  };

  const savePassiveWriting = (content: string, sid?: string) => {
    const id = sid ?? passiveSessionId;
    fetch("http://localhost:5000/passive-writing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: id,
        content,
      }),
    }).catch((err) => console.warn("Passive writing save failed:", err));
  };

  const handleSend = async () => {
    if (!entry.trim()) return;
    const userMessage = entry;
    const hasUserMessages = messages.some((m) => m.role === "user");

    // Log the user's message with date and time
    const now = new Date();
    const log: JournalLog = {
      date: now.toLocaleDateString("en-CA"),               // "2026-02-22"
      time: now.toLocaleTimeString("en-GB", { hour12: false }), // "14:35:07"
      text: userMessage,
    };
    saveLog(log);
    setJournalLogs((prev) => [...prev, log]);

    let generatedTitle: string | undefined;
    if (!hasUserMessages) {
      try {
        generatedTitle = await getTitle(userMessage);
      } catch {
        const trimmed = userMessage.trim();
        generatedTitle =
          trimmed.length > 56 ? trimmed.slice(0, 56).trim() + "…" : trimmed;
      }
    }

    // Persist user message (and title for first user message) to backend
    saveMessageToBackend("user", userMessage, sessionId, generatedTitle);

    setMessages((prev) => [...prev, { role: "user" as const, text: userMessage }]);
    setEntry("");

    try {
      const aiText = await getGeminiResponse(
        "You are a compassionate and empathetic mental health journal companion. The user said: \"" +
        userMessage +
        "\". Respond with a thoughtful, supportive, and brief reply (2-3 sentences). Acknowledge their feelings, ask a gentle follow-up question if appropriate, and maintain a warm conversational tone."
      );
      setMessages((prev) => [...prev, { role: "ai" as const, text: aiText }]);

      // Persist AI response to backend
      saveMessageToBackend("ai", aiText, sessionId);
    } catch {
      const fallbackText =
        "I hear you. It sounds like there's a lot on your mind today. Can you tell me more about what's weighing on you the most?";
      setMessages((prev) => [
        ...prev,
        { role: "ai" as const, text: fallbackText },
      ]);

      // Persist fallback AI response to backend
      saveMessageToBackend("ai", fallbackText, sessionId);
    }
  };

  const handleResumeChat = async (resumeSessionId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/messages/${resumeSessionId}`
      );

      const sessionData = await res.json();

      if (sessionData?.messages?.length > 0) {
        setSessionId(resumeSessionId);
        localStorage.setItem("journal_session_id", resumeSessionId);

        setMessages(
          sessionData.messages.map((m: any) => ({
            role: m.role || "user",
            text: m.text,
          }))
        );
      } else {
        setMessages([
          {
            role: "ai",
            text: "Welcome back! This session has no messages yet.",
          },
        ]);
      }
    } catch {
      setMessages([
        {
          role: "ai",
          text:
            "Welcome back. I couldn't load the previous session. Let's start fresh.",
        },
      ]);
    }

    setView("chat");
    setAiMode("active");
  };

    const handleStartNewChat = async () => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    console.log("NEW SESSION ID: ", newSessionId);
    localStorage.setItem("journal_session_id", newSessionId);

    // Reset messages with fresh AI greeting
    const greeting = "Hey, welcome back. How are you feeling today?";
    setMessages([{ role: "ai", text: greeting }]);

    // Save greeting to backend under new session
    saveMessageToBackend("ai", greeting, newSessionId);

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

  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user")?.text || "";

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
              onClick={() => { handleStartNewChat() }}
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
                  : "bg-secondary text-secondatoggleAiModery-foreground hover:bg-accent"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Continue Chat
            </button>
          </div>
        )}

        {/* New chat button for quiet/passive mode */}
        {aiMode === "quiet" && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEntry("");
                setPassiveContent("");
                const newId = crypto.randomUUID();
                setPassiveSessionId(newId);
                localStorage.setItem("passive_session_id", newId);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground shadow-soft hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              New Chat
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
              {/* Notebook text input – loaded from and saved to database (JSON) */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-5">
                <textarea
                  value={passiveContent}
                  onChange={(e) => setPassiveContent(e.target.value)}
                  placeholder="Write in your notebook… (saved to your logs)"
                  className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[100px]"
                  rows={4}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    disabled={isPassiveSaved}
                    variant={isPassiveSaved ? "outline" : "default"}
                    onClick={() => {
                      if (passiveContent.trim()) {
                        savePassiveWriting(passiveContent.trim());
                        refreshPassiveLogs();
                        setIsPassiveSaved(true);
                        setTimeout(() => setIsPassiveSaved(false), 3000);
                      }
                    }}
                    className={`rounded-xl transition-all duration-300 ${
                      isPassiveSaved
                        ? "border-green-500 text-green-600 bg-green-50 opacity-100 disabled:opacity-100"
                        : ""
                    }`}
                  >
                    {isPassiveSaved ? "✓ Saved" : "Save Entry"}
                  </Button>
                </div>
              </div>
              <NotebookView passiveLogs={passiveLogs} />
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
                      <div 
                        className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-breathe cursor-pointer hover:bg-primary/20 transition-all"
                        onClick={() => {
                          toast("Listening...", { description: "Speak into your microphone." });
                          setTimeout(() => toast.success("Voice note saved to local logs."), 2000);
                        }}
                      >
                        <Mic className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Tap to start speaking</p>
                    </div>
                  )}
                  {inputMode === "draw" && (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <div 
                        className="w-full h-32 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/80"
                        onClick={() => toast.info("Opening sketchpad window...")}
                      >
                        <p className="text-sm text-muted-foreground">Sketchpad — draw how you feel</p>
                      </div>
                    </div>
                  )}
                  {inputMode === "photo" && (
                    <div 
                      className="flex flex-col items-center gap-3 py-8 cursor-pointer hover:bg-muted/30 rounded-xl"
                      onClick={() => toast.info("Opening file uploader...")}
                    >
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
        <DynamicSuggestions latestUserMessage={latestUserMessage} />
      </div>
    </AppLayout>
  );
}
