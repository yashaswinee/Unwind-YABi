import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Users, TrendingDown, DollarSign, CalendarPlus, ShieldCheck, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const teamRiskData = [
  { team: "Engineering", risk: 72 },
  { team: "Design", risk: 45 },
  { team: "Product", risk: 58 },
  { team: "Marketing", risk: 32 },
  { team: "Support", risk: 65 },
];

const roiData = [
  { name: "Engaged", value: 68 },
  { name: "At Risk", value: 22 },
  { name: "Critical", value: 10 },
];

const COLORS = ["hsl(152,45%,38%)", "hsl(40,80%,55%)", "hsl(0,70%,55%)"];

const stats = [
  { label: "Active Users", value: "342", icon: Users, change: "+12%" },
  { label: "Turnover Risk", value: "18%", icon: TrendingDown, change: "-4%" },
  { label: "ROI (Annual)", value: "$2.4M", icon: DollarSign, change: "+31%" },
  { label: "Sessions Booked", value: "89", icon: CalendarPlus, change: "+23" },
];

export default function HrPortal() {
  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-2xl font-serif text-foreground">HR Wellness Portal</h1>
            <p className="text-sm text-muted-foreground">Anonymised team insights — no individual data exposed</p>
          </div>
        </div>

        {/* KPIs */}
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
              <span className="text-xs text-success">{stat.change}</span>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Team burnout risk */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="font-serif text-lg text-foreground mb-4">Team Burnout Risk</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamRiskData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="team" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(150,10%,45%)" }} width={85} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(140,15%,95%)",
                      border: "1px solid hsl(145,15%,88%)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => [`${v}%`, "Risk Level"]}
                  />
                  <Bar
                    dataKey="risk"
                    radius={[0, 8, 8, 0]}
                    fill="hsl(152,45%,38%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workforce wellness */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="font-serif text-lg text-foreground mb-4">Workforce Wellness</h2>
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roiData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {roiData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(140,15%,95%)",
                      border: "1px solid hsl(145,15%,88%)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {roiData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs text-muted-foreground">{d.name} ({d.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource management */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <h2 className="font-serif text-lg text-foreground mb-4">Resource Management</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Add Counsellor Hours", desc: "Expand capacity for high-risk teams", action: "Configure" },
              { label: "Schedule Unwind Day", desc: "AI-detected stress spike this week", action: "Plan Event" },
              { label: "Export Report", desc: "Download anonymised wellness report", action: "Download" },
            ].map((r) => (
              <div key={r.label} className="p-4 rounded-xl bg-muted space-y-2">
                <h3 className="text-sm font-medium text-foreground">{r.label}</h3>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
                <button className="text-xs font-medium text-primary hover:underline">{r.action} →</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
