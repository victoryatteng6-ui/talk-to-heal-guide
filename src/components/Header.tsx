import { Heart, LogIn, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Chat", path: "/chat" },
    { label: "Wellness", path: "/wellness" },
    { label: "Labs", path: "/labs" },
    { label: "Clinics", path: "/clinics" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Heart className="h-6 w-6 text-primary" aria-hidden="true" />
          HealthVoice
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-current={location.pathname === item.path ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="ml-1">
              <LogOut className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="ml-1">
              <Link to="/auth">
                <LogIn className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
