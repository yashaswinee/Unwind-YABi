import { NavLink, useLocation } from "react-router-dom";
import { BookOpen, BarChart3, Users, Heart, Building2, Leaf } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/dashboard", label: "Insights", icon: BarChart3 },
  { to: "/counsellors", label: "Support", icon: Users },
  { to: "/care", label: "Care Plan", icon: Heart },
  { to: "/hr", label: "HR Portal", icon: Building2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14 px-4">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-calm flex items-center justify-center">
              <Leaf className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl text-foreground">Unwind</span>
          </NavLink>
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
