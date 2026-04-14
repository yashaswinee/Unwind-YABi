import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Play, Calendar, MessageCircle, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { createScheduledMeet } from "@/lib/careApi";
import { toast } from "@/components/ui/sonner";

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
  const navigate = useNavigate();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedCounsellor, setSelectedCounsellor] = useState<string | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const handleMessage = () => {
    navigate("/care#message");
  };

  const handleScheduleMeet = (counsellorName: string) => {
    setSelectedCounsellor(counsellorName);
    setScheduleDateTime("");
    setScheduleOpen(true);
  };

  const handleScheduleSubmit = async () => {
    if (!selectedCounsellor || !scheduleDateTime.trim()) {
      toast.error("Please select date and time");
      return;
    }
    setScheduling(true);
    try {
      await createScheduledMeet(selectedCounsellor, scheduleDateTime);
      toast.success("Meeting scheduled. View it on your Care Plan.");
      setScheduleOpen(false);
      setSelectedCounsellor(null);
      setScheduleDateTime("");
      navigate("/care");
    } catch {
      toast.error("Failed to schedule. Try again.");
    } finally {
      setScheduling(false);
    }
  };

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
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => toast.info(`Playing introduction video for ${c.name}...`)}>
                    <Play className="w-3.5 h-3.5" />
                    Watch Intro
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 rounded-xl"
                    onClick={() => handleScheduleMeet(c.name)}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Schedule Meet
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-xl"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a meeting</DialogTitle>
            <DialogDescription>
              {selectedCounsellor ? `Pick date and time for your session with ${selectedCounsellor}.` : "Pick date and time."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <label className="text-sm font-medium text-foreground">Date & time</label>
            <input
              type="datetime-local"
              value={scheduleDateTime}
              onChange={(e) => setScheduleDateTime(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleSubmit} disabled={scheduling}>
              {scheduling ? "Scheduling…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
