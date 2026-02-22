import { useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Clock, Flame, ArrowDown, ArrowUp, RefreshCw, Loader2, Heart } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchInsights, type InsightsPayload } from "@/lib/insightsApi";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

const defaultChartData = [
  { day: "Mon", mood: 5, energy: 5 },
  { day: "Tue", mood: 5, energy: 5 },
  { day: "Wed", mood: 5, energy: 5 },
  { day: "Thu", mood: 5, energy: 5 },
  { day: "Fri", mood: 5, energy: 5 },
  { day: "Sat", mood: 5, energy: 5 },
  { day: "Sun", mood: 5, energy: 5 },
];

export default function Dashboard() {
  const {
    data: insights,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<InsightsPayload>({
    queryKey: ["insights"],
    queryFn: () => fetchInsights(false),
    staleTime: 60 * 1000,
  });

  const burnoutScore = insights?.burnoutScore ?? 0;
  const chartData = (insights?.mentalEnergyChart?.length ? insights.mentalEnergyChart : defaultChartData) as Array<{
    day: string;
    mood: number;
    energy: number;
  }>;
  const themes = insights?.topThemes ?? [];
  const signals = insights?.signals ?? [];
  const recommendCounselor = insights?.recommendCounselor ?? false;
  const hasShownSignalToast = useRef(false);

  // One-time notification when signals are available (humanly nudge to interact/wellbeing)
  useEffect(() => {
    if (hasShownSignalToast.current || !signals.length || isLoading) return;
    hasShownSignalToast.current = true;
    const first = signals[0];
    if (first?.text) {
      toast.info("A gentle check-in", {
        description: first.text,
        duration: 8000,
      });
    }
  }, [signals, isLoading]);

  const stats = [
    {
      label: "Avg Mood",
      value: insights ? String(insights.avgMood) : "—",
      icon: TrendingUp,
      change: "from your entries",
    },
    {
      label: "Entries",
      value: insights ? String(insights.entriesCount) : "—",
      icon: Clock,
      change: "chat + passive + dataset",
    },
    {
      label: "Streak",
      value: insights ? `${insights.streak}d` : "0d",
      icon: Flame,
      change: "consecutive days",
    },
    {
      label: "Burnout Risk",
      value: `${burnoutScore}%`,
      icon: AlertTriangle,
      change: burnoutScore > 70 ? "consider extra support" : "from your writing",
    },
  ];

  function formatSignalTime(iso: string) {
    try {
      return formatDistanceToNow(new Date(iso), { addSuffix: true });
    } catch {
      return "";
    }
  }

  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif text-foreground">Your Mind, Over Time</h1>
            <p className="text-sm text-muted-foreground">From your journal: continue chat messages, passive logs, and any dataset — entries count reflects all of these</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {recommendCounselor && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800"
          >
            <Heart className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">Extra care recommended</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Based on your recent writings, we suggest connecting with a counsellor. You can browse counsellors from the Care section.
              </p>
            </div>
          </motion.div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Could not load insights. Make sure the backend is running on port 5000 and try Refresh.
          </div>
        )}

        {!isLoading && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-xl border border-border p-4 shadow-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-serif text-foreground">{stat.value}</p>
                  <span
                    className={`text-xs ${
                      stat.label === "Burnout Risk" && burnoutScore > 70 ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {stat.change}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Mood chart */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="font-serif text-lg text-foreground mb-4">Mental Energy &amp; Mood</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(152,45%,38%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(152,45%,38%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(165,40%,72%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(165,40%,72%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(150,10%,45%)" }}
                    />
                    <YAxis hide domain={[0, 10]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(140,15%,95%)",
                        border: "1px solid hsl(145,15%,88%)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="mood"
                      stroke="hsl(152,45%,38%)"
                      fill="url(#moodGrad)"
                      strokeWidth={2}
                      name="Mood"
                    />
                    <Area
                      type="monotone"
                      dataKey="energy"
                      stroke="hsl(165,40%,72%)"
                      fill="url(#energyGrad)"
                      strokeWidth={2}
                      name="Energy"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Burnout meter */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="font-serif text-lg text-foreground mb-4">Burnout Meter</h2>
                <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${burnoutScore}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background:
                        burnoutScore > 70
                          ? "hsl(0,70%,55%)"
                          : burnoutScore > 40
                            ? "hsl(40,80%,55%)"
                            : "hsl(145,60%,42%)",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Calm</span>
                  <span>Caution</span>
                  <span>Danger</span>
                </div>
              </div>

              {/* Themes */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="font-serif text-lg text-foreground mb-4">Top Themes</h2>
                <div className="space-y-3">
                  {themes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Write more in your journal to see themes here.</p>
                  ) : (
                    themes.map((t) => (
                      <div key={t.label} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{t.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{t.count} mentions</span>
                          {t.trend === "up" ? (
                            <ArrowUp className="w-3 h-3 text-destructive" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Signal log / notifications */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="font-serif text-lg text-foreground mb-4">Signal Log</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Gentle prompts to check in, practice wellbeing, or reflect — based on what you’ve written.
              </p>
              <div className="space-y-3">
                {signals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No signals yet. Keep writing to get personalised nudges.</p>
                ) : (
                  signals.map((s, i) => (
                    <motion.div
                      key={s.id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{s.text}</p>
                        <span className="text-xs text-muted-foreground">{formatSignalTime(s.createdAt)}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
