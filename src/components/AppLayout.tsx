import { NavLink, useLocation } from "react-router-dom";
import { BookOpen, BarChart3, Users, Heart, Building2, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { Bell, Sparkles } from "lucide-react";
import { useState, useEffect} from "react";
import { useRef } from "react";

const navItems = [
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/dashboard", label: "Insights", icon: BarChart3 },
  { to: "/counsellors", label: "Support", icon: Users },
  { to: "/care", label: "Care Plan", icon: Heart },
  { to: "/hr", label: "HR Portal", icon: Building2 },
  
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const baseNotifications = [
    "It’s been a hard week. Why don't you catch a breath and try box breathing for 2 minutes?",
    "You left a draft of your journal. Just checking in — how are you feeling now?",
    "Small progress still counts. Want to write one thing you're proud of today?"
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [notifications, setNotifications] = useState<
    { text: string; time: string; timestamp: number }[]
  >([]);

  useEffect(() => {
    const now = new Date();

    const generated = baseNotifications.map((text, index) => {
      // random minutes ago between 5 and 600
      const minutesAgo = Math.floor(Math.random() * 600) + 5;
      const date = new Date(now.getTime() - minutesAgo * 60000);

      return {
        text,
        time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: date.getTime()
      };
    });

    // sort newest → oldest
    generated.sort((a, b) => b.timestamp - a.timestamp);

    setNotifications(generated);
  }, []);

  function NotificationItem({ text, time }: { text: string; time: string }) {
   return (
      <div className="p-3 rounded-xl bg-white/40 backdrop-blur-md border border-white/30 hover:bg-white/50 transition-all duration-200 cursor-pointer">
        <div className="flex justify-between items-start gap-3">
          <p className="text-sm text-foreground leading-relaxed flex-1">
            {text}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {time}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        
          <div className="container flex items-center justify-between h-14 px-4">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-calm flex items-center justify-center">
                <Leaf className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl text-foreground">Unwind</span>
            </NavLink>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-secondary rounded-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Glass Hamburger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  setIsOpen((prev) => !prev);
                  setHasUnread(false); // mark as read when opened
                }}
                className="relative p-2 rounded-full backdrop-blur-md bg-white/30 border border-white/40 shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Bell className="w-5 h-5 text-foreground" />

                {/* Unread Dot */}
                {hasUnread && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>

              {isOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl backdrop-blur-xl bg-white/30 border border-white/40 shadow-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    <Sparkles className="w-4 h-4" />
                    Gentle Reminders
                  </div>
                    {notifications.map((item, index) => (
                      <NotificationItem
                        key={index}
                        text={item.text}
                        time={item.time}
                      />
                    ))}
                  </div>
              )}
            </div>
          </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
