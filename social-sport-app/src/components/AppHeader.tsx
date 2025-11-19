import { useState } from "react";
import { Bell, List, LogOut, Menu, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import brandIcon from "@/assets/icon.png";

interface AppHeaderProps {
  showPrimaryCTA?: boolean;
}

export function AppHeader({ showPrimaryCTA = true }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isNavSheetOpen, setIsNavSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const userName = user?.name || "Guest";
  const userInitials = userName
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const mobileLinks = [
    { label: "Find a game", path: "/find-game" },
    { label: "Add your game", path: "/add-game" },
    { label: "Notifications", path: "/notifications" },
    { label: "Profile", path: "/profile" },
    { label: "Settings", path: "/settings" },
    { label: "Favourite games", path: "/favourites" },
  ];

  const routeLabels: Record<string, string> = {
    "/find-game": "Find a game",
    "/add-game": "Add a game",
    "/profile": "Profile",
    "/settings": "Settings",
    "/favourites": "Favourite games",
    "/": "Find a game",
  };

  const pageLabel = routeLabels[location.pathname] || "PlayBud";
  const showRefresh = location.pathname.startsWith("/find-game");

  const handleLogout = async () => {
    try {
      logout();
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    navigate(0);
  };

  const handleMobileNavigate = (path: string) => {
    navigate(path);
    setIsNavSheetOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <Sheet open={isNavSheetOpen} onOpenChange={setIsNavSheetOpen}>
        <div className="flex h-16 w-full items-center justify-between px-4 lg:hidden">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <img
              src={brandIcon}
              alt="PlayBud logo"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                <span className="text-[#e8702c]">Play</span>
                <span className="text-[#223c61]">Bud</span>
              </span>
              <span className="text-sm font-semibold text-foreground">{pageLabel}</span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {showRefresh && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )}
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-border bg-background"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </div>
        </div>

        <SheetContent side="left" className="w-[85%] max-w-sm px-0" aria-describedby={undefined}>
          <SheetHeader className="px-6">
            <SheetTitle className="text-left text-lg font-semibold">Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4 px-6 pb-6">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-white">
                {userInitials}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{userName}</span>
                <span className="text-xs text-muted-foreground">
                  {user?.email || "guest@playbud.app"}
                </span>
              </div>
            </div>
            <nav className="flex flex-col gap-2">
              {mobileLinks.map((link) => (
                <Button
                  key={link.path}
                  variant="ghost"
                  className={cn(
                    "justify-start rounded-xl border border-transparent px-4 py-3 text-base font-semibold transition-colors hover:border-border",
                    location.pathname === link.path && "border-primary/40 bg-primary/10 text-primary"
                  )}
                  onClick={() => handleMobileNavigate(link.path)}
                >
                  {link.label}
                </Button>
              ))}
              <Separator />
              <Button
                variant="destructive"
                className="justify-start rounded-xl border border-transparent px-4 py-3 text-base font-semibold"
                onClick={() => {
                  handleLogout();
                  setIsNavSheetOpen(false);
                }}
              >
                Logout
                <LogOut className="ml-2 h-4 w-4" />
              </Button>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden h-16 w-full items-center justify-between px-6 lg:flex">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-left"
          >
            <img
              src={brandIcon}
              alt="PlayBud logo"
              className="h-9 w-9 rounded-full object-cover"
            />
            <div className="leading-tight">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="text-[#e8702c]">Play</span>
                <span className="text-[#223c61]">Bud</span>
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-4 text-sm font-medium text-muted-foreground lg:flex">
            <span className="rounded-full border border-border px-3 py-1.5 text-foreground">
              Bring PlayBud to your city
            </span>
            <button
              className={`transition-colors hover:text-primary ${
                location.pathname === "/add-game" ? "text-primary font-semibold" : ""
              }`}
              onClick={() => navigate("/add-game")}
            >
              Add your game
            </button>
            <button
              className={`transition-colors hover:text-primary ${
                location.pathname === "/company-events" ? "text-primary font-semibold" : ""
              }`}
              onClick={() => navigate("/company-events")}
            >
              Company events
            </button>

            <button
              className={`transition-colors hover:text-primary ${
                location.pathname === "/find-game" ? "text-primary font-semibold" : ""
              }`}
              onClick={() => navigate("/find-game")}
            >
              Find a game
            </button>
          </div>

          {showRefresh && (
            <Button
              variant="outline"
              size="icon"
              className="hidden rounded-full lg:flex"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              location.pathname === "/notifications" && "text-primary"
            )}
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-4 w-4" />
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 rounded-full border border-border bg-background/80 px-3 py-1.5 text-sm font-medium hover:bg-background"
                >
                  <span className="hidden text-muted-foreground sm:inline">
                    Hi, <span className="text-foreground">{userName}!</span>
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-white">
                    {userInitials}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px] rounded-2xl">
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-3 py-2.5 text-sm font-medium"
                >
                  <List className="h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/settings")}
                  className="flex items-center gap-3 py-2.5 text-sm font-medium"
                >
                  <List className="h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/favourites")}
                  className="flex items-center gap-3 py-2.5 text-sm font-medium"
                >
                  <List className="h-4 w-4" />
                  Favourite Games
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-3 py-2.5 text-sm font-medium text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              className="rounded-full border-primary px-5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Sign up
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
