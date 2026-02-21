import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Clock, Flame, ArrowDown, ArrowUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const moodData = [
  { day: "Mon", mood: 7, energy: 6 },
  { day: "Tue", mood: 5, energy: 4 },
  { day: "Wed", mood: 6, energy: 5 },
  { day: "Thu", mood: 4, energy: 3 },
  { day: "Fri", mood: 6, energy: 7 },
  { day: "Sat", mood: 8, energy: 8 },
  { day: "Sun", mood: 3, energy: 2 },
];

const signals = [
  { text: "You mentioned feeling 'coded into a corner' three days ago — how does that feel now?", time: "3d ago" },
  { text: "Your entries this week are 40% shorter than usual. Want to check in?", time: "1d ago" },
  { text: "Sunday evenings seem consistently tough. Let's explore that.", time: "Just now" },
];

const themes = [
  { label: "Work pressure", count: 12, trend: "up" as const },
  { label: "Sleep quality", count: 8, trend: "down" as const },
  { label: "Social connection", count: 5, trend: "up" as const },
  { label: "Self-doubt", count: 7, trend: "up" as const },
];

export default function Dashboard() {
  const burnoutScore = 62;

  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-serif text-foreground">Your Mind, Over Time</h1>
          <p className="text-sm text-muted-foreground">Patterns you'd never notice yourself</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Avg Mood", value: "5.6", icon: TrendingUp, change: "-0.8" },
            { label: "Entries", value: "23", icon: Clock, change: "+3" },
            { label: "Streak", value: "7d", icon: Flame, change: "+2" },
            { label: "Burnout Risk", value: `${burnoutScore}%`, icon: AlertTriangle, change: "+12%" },
          ].map((stat, i) => (
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
              <span className={`text-xs ${stat.change.startsWith("+") && stat.label === "Burnout Risk" ? "text-danger" : "text-success"}`}>
                {stat.change} this week
              </span>
            </motion.div>
          ))}
        </div>

        {/* Mood chart */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <h2 className="font-serif text-lg text-foreground mb-4">Mental Energy</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodData}>
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
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(150,10%,45%)" }} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(140,15%,95%)",
                    border: "1px solid hsl(145,15%,88%)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="mood" stroke="hsl(152,45%,38%)" fill="url(#moodGrad)" strokeWidth={2} name="Mood" />
                <Area type="monotone" dataKey="energy" stroke="hsl(165,40%,72%)" fill="url(#energyGrad)" strokeWidth={2} name="Energy" />
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
                  background: burnoutScore > 70 ? "hsl(0,70%,55%)" : burnoutScore > 40 ? "hsl(40,80%,55%)" : "hsl(145,60%,42%)",
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
              {themes.map((t) => (
                <div key={t.label} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{t.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t.count} mentions</span>
                    {t.trend === "up" ? (
                      <ArrowUp className="w-3 h-3 text-danger" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-success" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Passive signals */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <h2 className="font-serif text-lg text-foreground mb-4">Signal Log</h2>
          <div className="space-y-3">
            {signals.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted"
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{s.text}</p>
                  <span className="text-xs text-muted-foreground">{s.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
