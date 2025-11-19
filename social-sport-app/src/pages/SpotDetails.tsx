import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { Spot } from "@/data/spots";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpotMap } from "@/components/SpotMap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AppFooter } from "@/components/AppFooter";
import {
  fetchReferenceData,
  type ReferenceDataResponse,
} from "@/services/reference.service";
import { getGame, type GameResponse } from "@/services/games.service";
import { joinGame as joinGameBooking } from "@/services/bookings.service";
import {
  gameToSpot,
  type SpotTransformLookups,
} from "@/utils/game-to-spot";
import { useAuth } from "@/contexts/AuthContext";
import brandIcon from "@/assets/icon.png";

type LocationState = {
  spot?: Spot;
};

interface DisplayParticipant {
  id: string;
  name: string;
  initials: string;
  profileHref: string;
}

const createEmptyLookups = (): SpotTransformLookups => ({
  cityMap: new Map(),
  sportMap: new Map(),
  abilityMap: new Map(),
  genderMap: new Map(),
});

const buildLookups = (data: ReferenceDataResponse): SpotTransformLookups => {
  const cityMap = new Map<string, { label: string; center: [number, number]; radiusKm: number }>();
  data.cities?.forEach((city) => {
    cityMap.set(city.slug, {
      label: city.name,
      center: [city.center_lng, city.center_lat],
      radiusKm: city.radius_km,
    });
  });

  const sportMap = new Map<string, string>();
  data.sports?.forEach((sport) => {
    const key = sport.code ?? sport.slug;
    sportMap.set(key, sport.name);
  });

  const abilityMap = new Map<string, string>();
  data.abilities?.forEach((ability) => {
    abilityMap.set(ability.name, ability.name);
  });

  const genderMap = new Map<string, string>();
  data.genders?.forEach((gender) => {
    genderMap.set(gender.name, gender.name);
  });

  return {
    cityMap,
    sportMap,
    abilityMap,
    genderMap,
  };
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const formatPrice = (spot: Spot) => {
    if (!spot.isPaid || !spot.priceCents) return "Free";
    const amount = (spot.priceCents / 100).toFixed(0);
    return `₦${Number(amount).toLocaleString()}`;
  };


const getInitialsFromName = (name: string) =>
  name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "";

const SpotDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationSpot = (location.state as LocationState | undefined)?.spot ?? null;
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const [lookups, setLookups] = useState<SpotTransformLookups>(() => createEmptyLookups());
  const [rawGame, setRawGame] = useState<GameResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!locationSpot);
  const [error, setError] = useState<string | null>(null);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isJoinSubmitting, setIsJoinSubmitting] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    if (isJoinOpen && user?.email && !attendeeEmail) {
      setAttendeeEmail(user.email);
    }
  }, [isJoinOpen, user?.email, attendeeEmail]);
  const refreshGame = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const data = await getGame(id);
      setRawGame(data);
    } catch (refreshError) {
      console.error("Failed to refresh game", refreshError);
    }
  }, [id]);
  useEffect(() => {
    let cancelled = false;
    const loadReferenceData = async () => {
      try {
        const data = await fetchReferenceData();
        if (!cancelled) {
          setLookups(buildLookups(data));
        }
      } catch (referenceError) {
        console.error("Failed to load reference data", referenceError);
      }
    };

    loadReferenceData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    const loadGame = async () => {
      if (!locationSpot) {
        setIsLoading(true);
      }
      try {
        const data = await getGame(id);
        if (!cancelled) {
          setRawGame(data);
          setError(null);
        }
      } catch (gameError) {
        console.error("Failed to load game", gameError);
        if (!cancelled && !locationSpot) {
          setError("We couldn't find that game.");
        }
      } finally {
        if (!cancelled && !locationSpot) {
          setIsLoading(false);
        }
      }
    };

    loadGame();

    return () => {
      cancelled = true;
    };
  }, [id, locationSpot]);

  const spot = useMemo<Spot | null>(() => {
    if (rawGame) {
      return gameToSpot(rawGame, lookups);
    }
    return locationSpot;
  }, [rawGame, lookups, locationSpot]);

  useEffect(() => {
    if (spot?.players && user?.id) {
      setHasJoined(spot.players.some((player) => player.id === user.id));
    } else {
      setHasJoined(false);
    }
  }, [spot?.players, user?.id]);
  const handleJoinButtonClick = () => {
    if (!spot) {
      return;
    }
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Create an account or log in before joining a game.",
        variant: "destructive",
      });
      navigate("/auth", { state: { from: `/games/${spot.id}` } });
      return;
    }
    setIsJoinOpen(true);
  };
  const mapsUrl = useMemo(() => {
    if (!spot) {
      return null;
    }
    // const hasCoordinates =
    //   typeof spot.lat === "number" &&
    //   typeof spot.lng === "number" &&
    //   Number.isFinite(spot.lat) &&
    //   Number.isFinite(spot.lng);

    // if (hasCoordinates) {
    //   return `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;
    // }

    const query = encodeURIComponent(spot.address || spot.title);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }, [spot]);

  const hostInitials = useMemo(
    () => getInitialsFromName(spot?.hostName ?? ""),
    [spot?.hostName]
  );
  const [participantNameOverrides, setParticipantNameOverrides] = useState<
    Record<string, { name: string; initials: string }>
  >({});

  const displayParticipants = useMemo<DisplayParticipant[]>(() => {
    const players = spot?.players ?? [];
    return players.map((player, index) => {
      const override = player.id ? participantNameOverrides[player.id] : undefined;
      const fallbackName = player.name?.trim() || `Player ${index + 1}`;
      const name = override?.name || fallbackName;
      const initials = override?.initials || player.initials || getInitialsFromName(name);
      const profileHref = player.id ? `/profile?user=${player.id}` : "/profile";
      return {
        id: player.id || `player-${index}`,
        name,
        initials,
        profileHref,
      };
    });
  }, [spot?.players, participantNameOverrides]);

  const resetForm = () => {
    setAttendeeName("");
    setAttendeeEmail("");
    setNote("");
  };

  const handleConfirmJoin = async () => {
    if (!spot) {
      return;
    }
    setIsJoinSubmitting(true);
    try {
      const assembledNotes = [
        attendeeName.trim() ? `Name: ${attendeeName.trim()}` : null,
        attendeeEmail.trim() ? `Email: ${attendeeEmail.trim()}` : null,
        note.trim() ? `Note: ${note.trim()}` : null,
      ]
        .filter(Boolean)
        .join(" | ") || undefined;

      await joinGameBooking(spot.id, { notes: assembledNotes });
      if (user?.id) {
        const providedName = attendeeName.trim() || user.name || `Player`;
        setParticipantNameOverrides((prev) => ({
          ...prev,
          [user.id]: {
            name: providedName,
            initials: getInitialsFromName(providedName),
          },
        }));
      }
      setHasJoined(true);
      setIsJoinOpen(false);
      toast({
        title: "You're in!",
        description: `We'll let ${(spot.hostName || spot.title)} know you're joining ${spot.title}.`,
      });
      resetForm();
      await refreshGame();
    } catch (joinError) {
      const message =
        joinError instanceof Error ? joinError.message : "Unable to join this game right now.";
      toast({
        variant: "destructive",
        title: "Join failed",
        description: message,
      });
    } finally {
      setIsJoinSubmitting(false);
    }
  };

  if (isLoading && !spot) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-semibold text-foreground">
          Loading game details…
        </p>
        <p className="text-sm text-muted-foreground">
          Hang tight while we fetch the latest information.
        </p>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl font-semibold text-foreground">
          {error ?? "We couldn't find that game."}
        </p>
        <p className="text-sm text-muted-foreground">
          It might have been removed or is no longer available.
        </p>
        <Button onClick={() => navigate("/find-game")}>Browse games</Button>
      </div>
    );
  }

  const priceLabel = formatPrice(spot);
  const startText = formatDate(spot.startTime);
  const startTimeText = formatTime(spot.startTime);
  const endTimeText = formatTime(spot.endTime);
  const attendees = displayParticipants.length;
  const capacity = spot.capacity ?? attendees;
  const remainingSpots = Math.max(capacity - attendees, 0);
  const hasPlayers = attendees > 0;
  const mapsHref = mapsUrl ?? "https://www.google.com/maps";

  return (
    <div className="flex flex-col gap-10 px-6 py-10">
 <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  {/* Left section */}
  <div className="flex flex-col w-full">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div>
          <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            <span>{spot.city}</span>
            <span>·</span>
            <span>{spot.sportCode}</span>
          </div>

          {/* Title and Price Label in same row on mobile */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              {spot.title}
            </h1>
            <Badge className="rounded-full bg-primary/10 text-base font-semibold text-primary px-4 py-1 sm:hidden ml-12 translate-x-2">
           {priceLabel}
            </Badge>
          </div>
        </div>
      </div>
    </div>

    {/* Join Game button below for mobile */}
    <Button
      className="mt-3 rounded-full bg-primary px-5 text-sm sm:hidden font-semibold text-primary-foreground hover:bg-primary/90 w-full"
      onClick={handleJoinButtonClick}
      disabled={hasJoined}
    >
      {hasJoined ? "Joined" : "Join Game"}
    </Button>
  </div>

  {/* Right section (for desktop view) */}
  <div className="hidden sm:flex items-center gap-3">
    <Badge className="rounded-full bg-primary/10 text-base font-semibold text-primary px-4 py-1">
      {priceLabel}
    </Badge>
    <Button
      className="rounded-full bg-primary px-5 text-sm sm:text-base font-semibold text-primary-foreground hover:bg-primary/90"
      onClick={handleJoinButtonClick}
      disabled={hasJoined}
    >
      {hasJoined ? "Joined" : "Join Game"}
    </Button>
  </div>
</div>





      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="relative aspect-[16/7] w-full">
              <img
                src={spot.coverImage}
                alt={spot.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="grid gap-6 border-t border-border px-6 py-6 sm:grid-cols-4">
              <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                <img
                  src={brandIcon}
                  alt="PlayBud"
                  className="h-5 w-5 rounded-full object-cover"
                />
                <span className="text-sm font-semibold text-foreground">
                  {spot.sportCode}
                </span>
                <span>{spot.skillLevel}</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {spot.gender}
                </span>
                <span>
                  Players {attendees}/{spot.capacity}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {startText}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {startTimeText} - {endTimeText}
                </span>
              </div>
            </div>
          </div>

          <section className="space-y-6 rounded-3xl border border-border bg-card/70 p-8 shadow-sm backdrop-blur">
            <header className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary">
                  Host
                </p>
                <h2 className="text-lg font-semibold text-foreground">
                  Hosted by {spot.hostName}
                </h2>
                <button
                  type="button"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  View all games
                </button>
              </div>
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {hostInitials ? (
                  hostInitials
                ) : (
                  <img
                    src={brandIcon}
                    alt="PlayBud host avatar"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Description
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {spot.descriptionPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 text-primary">✅</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                {spot.extraNotes.length > 0 && (
                  <div className="space-y-2 rounded-2xl bg-muted/40 p-4">
                    {spot.extraNotes.map((extraNote, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        {extraNote}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Rules & Format
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {spot.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 rounded-2xl border border-dashed border-border p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Cancellation Policy
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {spot.cancellationPolicy}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-border bg-card/70 p-8 shadow-sm backdrop-blur">
            <h3 className="text-lg font-semibold text-foreground">Location</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {spot.address}
              </a>
              {spot.locationNotes.map((noteItem, index) => (
                <p key={index}>{noteItem}</p>
              ))}
            </div>
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="h-[360px]">
                <SpotMap spots={[spot]} selectedSpotId={spot.id} />
              </div>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-6 rounded-3xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Players
              </p>
              <p className="text-xs text-muted-foreground">
                {`${attendees} / ${capacity} players`}
              </p>
            </div>
            <Badge variant="secondary" className="gap-1 rounded-full">
              <Wallet className="h-3.5 w-3.5" />
              {priceLabel}
            </Badge>
          </div>

          <div className="space-y-3">
            {!hasPlayers && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
                Be the first to join this session.
              </div>
            )}
            {displayParticipants.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-background px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-primary/10 text-sm font-semibold text-primary">
                    {player.initials ? (
                      player.initials
                    ) : (
                      <img
                        src={brandIcon}
                        alt={`${player.name} avatar`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    <Link
                      to={player.profileHref}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {player.name}
                    </Link>
                    <span className="ml-1 text-xs font-normal lowercase text-muted-foreground">
                      joined
                    </span>
                  </p>
                </div>
              </div>
            ))}
            {remainingSpots > 0 && (
              <div className="flex items-center justify-between rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-sm font-semibold text-primary">
                    +
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {remainingSpots} spots left
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Join the roster today
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={handleJoinButtonClick}
                  disabled={hasJoined}
                >
                  {hasJoined ? "Joined" : "Join"}
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>
      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-0 max-h-[90vh] overflow-hidden">
          <DialogHeader className="space-y-1 border-b border-border px-6 py-4 text-left">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Join {spot.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {priceLabel === "Free"
                ? "Secure your spot. No payment required today."
                : `Secure your spot. This session is listed at ${priceLabel}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 px-6 py-6 overflow-y-auto max-h-[75vh]">
            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-name" className="text-sm font-medium">
                  Your name
                </Label>
                <Input
                  id="join-name"
                  value={attendeeName}
                  onChange={(event) => setAttendeeName(event.target.value)}
                  placeholder="Abdulwaheed Adedayo"
                  className="h-11 rounded-xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="join-email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="join-email"
                  type="email"
                  value={attendeeEmail}
                  onChange={(event) => setAttendeeEmail(event.target.value)}
                  placeholder="your@email.com"
                  className="h-11 rounded-xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="join-note" className="text-sm font-medium">
                  Message to host (optional)
                </Label>
                <Textarea
                  id="join-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Let the host know anything they should be aware of."
                  className="min-h-[110px] rounded-2xl border-2 border-border focus:border-primary"
                />
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold text-foreground">Session details</p>
              <div className="flex items-center gap-4">
                <img
                  src={spot.coverImage}
                  alt={spot.title}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">{spot.title}</p>
                  <p className="text-muted-foreground">{startText}</p>
                  <p className="text-muted-foreground">
                    {startTimeText} - {endTimeText}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{startText}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    {startTimeText} - {endTimeText}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-2 text-primary underline-offset-4 hover:underline"
                  >
                    {spot.address}
                  </a>
                </div>
                <p className="text-xs text-muted-foreground/80">
                  {priceLabel === "Free"
                    ? "This game is free to join on PlayBud."
                    : `This game is listed at ${priceLabel}. You’ll see any fees listed on the event page.`}
                </p>
              </div>
            </section>

            <Button
              className="h-12 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-80"
              onClick={handleConfirmJoin}
              disabled={isJoinSubmitting || !attendeeName.trim()}
            >
              {isJoinSubmitting ? "Joining..." : "Join game"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AppFooter />
    </div>
  );
};

export default SpotDetails;
