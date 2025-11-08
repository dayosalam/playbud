import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchReferenceData } from "@/services/reference.service";
import { getMyGames, type GameWithBooking } from "@/services/bookings.service";

interface User {
  id: string;
  email: string;
  displayName: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  reputationScore?: number;
  createdAt?: string;
  preferredCity?: string | null;
  heardAbout?: string | null;
}

interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  city?: string;
  phone?: string;
  avatarUrl?: string;
}

interface FormattedGame {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  sport: string;
  status: "pending" | "confirmed" | "completed" | "unapproved";
  statusLabel: string;
}

const combineDateAndTime = (dateIso: string, time?: string | null) => {
  const date = new Date(dateIso);
  if (time) {
    const [hour = "0", minute = "0", second = "0"] = time.split(":");
    date.setHours(Number(hour), Number(minute), Number(second), 0);
  }
  return date;
};

const formatTimeRange = (start: Date, end: Date) => {
  return `${start.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  })} – ${end.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
};

const Profile = () => {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileData>({});
  const [cityOptions, setCityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [activeGamesTab, setActiveGamesTab] = useState<"upcoming" | "previous">("upcoming");
  const [upcomingGames, setUpcomingGames] = useState<FormattedGame[]>([]);
  const [previousGames, setPreviousGames] = useState<FormattedGame[]>([]);
  const [isGamesLoading, setIsGamesLoading] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!authUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const mappedUser: User = {
      id: authUser.id,
      email: authUser.email,
      displayName: authUser.name,
      bio: "",
      phone: "",
      avatarUrl: "",
      role: "player",
      preferredCity: authUser.preferredCity,
      heardAbout: authUser.heardAbout,
    };

    setUser(mappedUser);
    setFormData({
      displayName: mappedUser.displayName,
      bio: mappedUser.bio || "",
      city: authUser.preferredCity || "",
      phone: mappedUser.phone || "",
      avatarUrl: mappedUser.avatarUrl || "",
    });
    setIsLoading(false);
  }, [authUser, authLoading]);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const data = await fetchReferenceData();
        if (data.cities?.length) {
          const options = data.cities.map((city) => ({
            value: city.slug,
            label: city.name,
          }));
          setCityOptions(options);
          setFormData((prev) => ({
            ...prev,
            city: prev.city || options[0]?.value || "",
          }));
        }
      } catch (error) {
        console.error("Failed to load cities", error);
      }
    };
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const loadGames = async () => {
      setIsGamesLoading(true);
      try {
        const response = await getMyGames();
        const now = new Date();
        const upcoming: FormattedGame[] = [];
        const previous: FormattedGame[] = [];

        response.forEach(({ game }) => {
          const start = combineDateAndTime(game.date, game.start_time);
          const end = combineDateAndTime(game.date, game.end_time);
          const dateLabel = start.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const timeLabel = formatTimeRange(start, end);

          let status: FormattedGame["status"];
          let statusLabel: string;

          if (game.status === "unapproved") {
            status = "unapproved";
            statusLabel = "Unapproved";
          } else if (start < now) {
            status = "completed";
            statusLabel = "Completed";
          } else if (game.status === "pending") {
            status = "pending";
            statusLabel = "Pending approval";
          } else {
            status = "confirmed";
            statusLabel = "Confirmed";
          }

          const formatted: FormattedGame = {
            id: game.id,
            title: game.name,
            dateLabel,
            timeLabel,
            location: `${game.venue}, ${game.city_slug}`,
            sport: game.sport_code,
            status,
            statusLabel,
          };

          if (status === "completed" || status === "unapproved") {
            previous.push(formatted);
          } else {
            upcoming.push(formatted);
          }
        });

        setUpcomingGames(upcoming);
        setPreviousGames(previous);
      } catch (error) {
        console.error("Failed to load games", error);
        toast({
          title: "Error loading games",
          description: "Unable to load your games right now.",
          variant: "destructive",
        });
      } finally {
        setIsGamesLoading(false);
      }
    };

    loadGames();
  }, [authUser]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setTimeout(() => {
        if (user) {
          const updatedUser: User = {
            ...user,
            displayName: formData.displayName || user.displayName,
            preferredCity: formData.city || user.preferredCity,
            bio: formData.bio || user.bio,
            phone: formData.phone || user.phone,
            avatarUrl: formData.avatarUrl || user.avatarUrl,
          };
          setUser(updatedUser);
        }
        setIsEditing(false);
        setIsSaving(false);
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
      }, 800);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update your profile",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        displayName: user.displayName,
        bio: user.bio || "",
        city: user.preferredCity || "",
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
    setIsEditing(false);
  };

  const selectedCityLabel = useMemo(() => {
    if (!user?.preferredCity) return null;
    return cityOptions.find((option) => option.value === user.preferredCity)?.label || user.preferredCity;
  }, [user?.preferredCity, cityOptions]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const currentGames = activeGamesTab === "upcoming" ? upcomingGames : previousGames;

  const statusClasses: Record<FormattedGame["status"], string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    completed: "bg-muted text-muted-foreground",
    pending: "bg-amber-100 text-amber-700",
    unapproved: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="container max-w-4xl py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user.displayName}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  {selectedCityLabel && (
                    <>
                      <MapPin className="h-4 w-4" />
                      {selectedCityLabel}
                    </>
                  )}
                </CardDescription>
                {user.reputationScore !== undefined && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span>{user.reputationScore} reputation points</span>
                  </div>
                )}
              </div>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-6 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveGamesTab("upcoming")}
                  className={
                    activeGamesTab === "upcoming"
                      ? "text-primary border-b-2 border-primary pb-1"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  Upcoming games ({upcomingGames.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGamesTab("previous")}
                  className={
                    activeGamesTab === "previous"
                      ? "text-primary border-b-2 border-primary pb-1"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  Previous games ({previousGames.length})
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {isGamesLoading ? (
                <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                  Loading your games...
                </div>
              ) : currentGames.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                  {activeGamesTab === "upcoming"
                    ? "You don't have any upcoming games yet. Start exploring to join one."
                    : "No past games recorded yet. Once you've played, they'll appear here."}
                </div>
              ) : (
                currentGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card/80 p-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{game.title}</h3>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {game.sport}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[game.status]}`}
                        >
                          {game.statusLabel}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{game.dateLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="line-clamp-2">{game.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>{game.timeLabel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        {game.statusLabel}
                      </span>
                      <Button variant="ghost" size="sm" className="text-primary">
                        View details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">Latest activity</p>
                <p>Stay tuned for updates.</p>
              </div>
            </div>
          </div>

          <Separator />

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName || ""}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Preferred city</Label>
                {cityOptions.length ? (
                  <Select
                    value={formData.city || ""}
                    onValueChange={(value) => setFormData({ ...formData, city: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="city" value={formData.city || ""} disabled placeholder="Loading cities..." />
                )}
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Your phone number"
                />
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ""}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                <p>{user.email}</p>
              </div>

              {user.phone && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Phone</h3>
                  <p>{user.phone}</p>
                </div>
              )}

              {selectedCityLabel && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Preferred city</h3>
                  <p>{selectedCityLabel}</p>
                </div>
              )}

              {user.bio && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Bio</h3>
                  <p className="text-sm">{user.bio}</p>
                </div>
              )}

              {user.heardAbout && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    How you heard about us
                  </h3>
                  <p className="text-sm capitalize">{user.heardAbout}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Role</h3>
                <p className="capitalize">{user.role}</p>
              </div>

              {user.createdAt && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Member Since</h3>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
