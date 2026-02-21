import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, BookOpen, BarChart3, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: BookOpen,
    title: "AI Journaling",
    desc: "Express yourself through text, voice, drawing, or photos. Your AI companion holds space and gently guides you toward relief.",
    link: "/journal",
  },
  {
    icon: BarChart3,
    title: "Reflection Dashboard",
    desc: "See your mind over time — mood trends, recurring triggers, and patterns you'd never notice on your own.",
    link: "/dashboard",
  },
  {
    icon: Users,
    title: "Counsellor Matching",
    desc: "When self-help isn't enough, we connect you with the right professional matched to your cognitive style.",
    link: "/counsellors",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        <div className="relative container max-w-4xl mx-auto px-4 pt-20 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm">
              <Leaf className="w-4 h-4" />
              Mental wellness, reimagined
            </div>
            <h1 className="text-5xl md:text-6xl font-serif text-foreground leading-tight">
              Unwind
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              A dialogue with purpose. Journal freely, understand your patterns,
              and find the right support — all in one calm space.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link to="/journal">
                <Button size="lg" className="rounded-xl gap-2 shadow-soft">
                  Start Journaling <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="rounded-xl">
                  View Insights
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container max-w-5xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
            >
              <Link to={f.link} className="block group">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card h-full space-y-4 transition-all group-hover:shadow-soft group-hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <h3 className="font-serif text-lg text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
