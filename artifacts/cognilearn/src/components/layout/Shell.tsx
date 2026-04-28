import { Link, useLocation } from "wouter";
import { Brain, Gamepad2, LineChart, Settings, Menu, Sparkles, LogOut, MessageCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Sparkles },
  { href: "/games", label: "Play Games", icon: Gamepad2 },
  { href: "/progress", label: "My Progress", icon: LineChart },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/assistant", label: "AI Assistant", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const playerName = localStorage.getItem("brightways_name") ?? "Explorer";

  const handleLogout = () => {
    localStorage.removeItem("brightways_name");
    localStorage.removeItem("brightways_user_id");
    localStorage.removeItem("brightways_avatar");
    setLocation("/login");
  };

  const NavLinks = () => (
    <div className="flex flex-col gap-2 p-4">
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href}>
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-lg font-bold transition-all cursor-pointer",
              location === item.href
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-foreground/80 hover:bg-primary/10 hover:text-primary"
            )}
            onClick={() => setOpen(false)}
            data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
          >
            <item.icon className="h-6 w-6" />
            {item.label}
          </div>
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-lg font-bold text-foreground/60 hover:bg-red-50 hover:text-red-500 transition-all mt-2"
      >
        <LogOut className="h-6 w-6" />
        Sign Out
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 flex-col border-r-4 border-primary/10 bg-card md:flex">
        <div className="flex items-center gap-3 border-b-4 border-primary/10 p-6">
          <div className="rounded-2xl bg-primary p-2 shadow-lg shadow-primary/30">
            <Brain className="h-8 w-8 text-primary-foreground" />
          </div>
          <span className="text-2xl font-black text-primary tracking-tight">Brightways</span>
        </div>
        <div className="px-6 py-3 border-b border-primary/10">
          <p className="text-sm text-muted-foreground font-medium">Logged in as</p>
          <p className="font-black text-foreground text-lg">{playerName} 👋</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-20 items-center border-b-4 border-primary/10 bg-card px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 border-r-4 border-primary/10">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex items-center gap-3 border-b-4 border-primary/10 p-6">
              <div className="rounded-2xl bg-primary p-2">
                <Brain className="h-8 w-8 text-primary-foreground" />
              </div>
              <span className="text-2xl font-black text-primary tracking-tight">Brightways</span>
            </div>
            <div className="px-6 py-3 border-b border-primary/10">
              <p className="text-sm text-muted-foreground font-medium">Logged in as</p>
              <p className="font-black text-foreground text-lg">{playerName} 👋</p>
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
        <div className="ml-4 flex items-center gap-2">
          <div className="rounded-xl bg-primary p-1.5 shadow-md">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-black text-primary tracking-tight">Brightways</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-10">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
