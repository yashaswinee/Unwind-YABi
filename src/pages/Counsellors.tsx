import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Play, Calendar, MessageCircle, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const counsellors = [
  {
    name: "Dr. Priya Sharma",
    specialty: "Tech Burnout & Cognitive Behavioral Therapy",
    compatibility: 94,
    intensity: "Moderate",
    approach: "Analytical, empathetic, solution-oriented",
    bio: "12 years helping tech professionals reclaim balance. Specialises in cognitive restructuring for high-achievers.",
    avatar: "PS",
  },
  {
    name: "James Okonkwo",
    specialty: "Mindfulness & Stress Management",
    compatibility: 87,
    intensity: "Mild to Moderate",
    approach: "Reflective, calm, mindfulness-based",
    bio: "Combines modern neuroscience with contemplative practice. Gentle approach for those new to therapy.",
    avatar: "JO",
  },
  {
    name: "Dr. Elena Voss",
    specialty: "Acute Stress & Trauma-Informed Care",
    compatibility: 78,
    intensity: "Moderate to Acute",
    approach: "Direct, structured, evidence-based",
    bio: "Specialist in acute stress responses. Background in crisis intervention and EMDR therapy.",
    avatar: "EV",
  },
];

export default function Counsellors() {
  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Intensity report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warm rounded-2xl p-6 border border-border"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-warm-foreground mt-0.5" />
            <div>
              <h2 className="font-serif text-lg text-warm-foreground">Why we're suggesting support</h2>
              <p className="text-sm text-warm-foreground/80 mt-1 leading-relaxed">
                Over the past 2 weeks, we've noticed a shift in your cognitive style: increased isolation language,
                declining entry frequency, and a rising burnout score. Connecting with a professional could help you
                work through this pattern before it deepens.
              </p>
            </div>
          </div>
        </motion.div>

        <div>
          <h1 className="text-2xl font-serif text-foreground">The Right Person, Right Moment</h1>
          <p className="text-sm text-muted-foreground">Matched to your cognitive style and current needs</p>
        </div>

        {/* Counsellor cards */}
        <div className="space-y-5">
          {counsellors.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-calm flex items-center justify-center text-primary-foreground font-serif text-lg flex-shrink-0">
                    {c.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg text-foreground">{c.name}</h3>
                      <div className="flex items-center gap-1 bg-accent px-3 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 text-primary" />
                        <span className="text-sm font-medium text-accent-foreground">{c.compatibility}% match</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{c.specialty}</p>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed">{c.bio}</p>

                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                    {c.approach}
                  </span>
                  <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                    Intensity: {c.intensity}
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                    <Play className="w-3.5 h-3.5" />
                    Watch Intro
                  </Button>
                  <Button size="sm" className="gap-2 rounded-xl">
                    <Calendar className="w-3.5 h-3.5" />
                    Schedule Meet
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2 rounded-xl">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
