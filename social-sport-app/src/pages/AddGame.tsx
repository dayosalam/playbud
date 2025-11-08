import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Calendar,
  Clock,
  Clock8,
  MapPin,
  Share2,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import organiserImage from "@/assets/cimmunity.png";
import { AppFooter } from "@/components/AppFooter";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchReferenceData } from "@/services/reference.service";
import { createGame } from "@/services/games.service";
import { ensureOrganizer, getMyOrganizer, type Organizer } from "@/services/organizers.service";
import { useAuth } from "@/contexts/AuthContext";

const benefits = [
  {
    title: "We help you fill your games",
    description:
      "Tap into thousands of active players looking for social and competitive sessions every week.",
    icon: Users,
  },
  {
    title: "Instant secure payments",
    description:
      "No more chasing bank transfers – Sportas handles payments so you can focus on the session.",
    icon: BadgeCheck,
  },
  {
    title: "Sports is all we do",
    description:
      "Purpose-built tools for organisers means less admin and more time on court.",
    icon: Target,
  },
];

const steps = [
  {
    number: "1",
    icon: Clock8,
    title: "Set up in minutes",
    copy: "Create your game page with venue, format, and capacity in one guided flow.",
  },
  {
    number: "2",
    icon: Share2,
    title: "Share once, reach many",
    copy: "Publish and share the link – players follow and receive instant notifications.",
  },
  {
    number: "3",
    icon: Users,
    title: "Run the game",
    copy: "Check players in, run the session, and track attendance all in the same place.",
  },
];

const faqs = [
  {
    question: "How do you help me find players?",
    answer:
      "We surface your games to thousands of nearby players and share marketing assets so you can promote your sessions.",
  },
  {
    question: "How long does approval take?",
    answer:
      "New organisers are typically approved within 24 hours once we verify venue and organiser details.",
  },
  {
    question: "Do players need the app?",
    answer:
      "No – players can join via web or mobile, but downloading the app unlocks reminders and attendance tracking.",
  },
];

interface GameFormState {
  name: string;
  venue: string;
  city: string;
  sport: string;
  date: string;
  startTime: string;
  endTime: string;
  skill: string;
  gender: string;
  players: string;
  description: string;
  rules: string;
  frequency: "one-off" | "recurring";
  price: string;
  isPrivate: boolean;
  cancellation: string;
  teamSheet: boolean;
}

const defaultGameForm: GameFormState = {
  name: "",
  venue: "",
  city: "",
  sport: "",
  date: "",
  startTime: "",
  endTime: "",
  skill: "",
  gender: "",
  players: "12",
  description: "",
  rules: "",
  frequency: "one-off",
  price: "",
  isPrivate: false,
  cancellation: "24 Hours",
  teamSheet: true,
};

const AddGame = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isOrganiserModalOpen, setIsOrganiserModalOpen] = useState(false);
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGoodExampleOpen, setIsGoodExampleOpen] = useState(false);
  const [cityOptions, setCityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [sportOptions, setSportOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [abilityOptions, setAbilityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [genderOptions, setGenderOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [organiserForm, setOrganiserForm] = useState({
    sports: "",
    experience: "",
    slug: "",
  });
  const [existingOrganizer, setExistingOrganizer] = useState<Organizer | null>(null);
  const [isOrganizerCheckInFlight, setIsOrganizerCheckInFlight] = useState(false);
  const [gameForm, setGameForm] = useState<GameFormState>(() => ({ ...defaultGameForm }));

  const formattedSlug = useMemo(
    () => organiserForm.slug.trim().replace(/\s+/g, "-").toLowerCase(),
    [organiserForm.slug]
  );

  const normalizeTime = (value?: string): string => {
    if (!value) return "00:00:00";
  
    try {
      // Handle "7:30", "07:30", "07:30:00", or "7:30 PM"
      const date = new Date(`1970-01-01T${value}`);
      if (isNaN(date.getTime())) {
        // fallback: try parsing manually
        const [hours, minutes, seconds = "00"] = value.split(":");
        const h = hours.padStart(2, "0");
        const m = minutes?.padStart(2, "0") || "00";
        const s = seconds.padStart(2, "0");
        return `${h}:${m}:${s}`;
      }
  
      // Always output in HH:mm:ss
      return date.toISOString().substring(11, 19);
    } catch {
      return "00:00:00";
    }
  };
  

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const data = await fetchReferenceData();
        if (data.cities?.length) {
          setCityOptions(data.cities.map((city) => ({
            value: city.slug,
            label: city.name,
          })));
          setGameForm((prev) => ({
            ...prev,
            city: prev.city || data.cities[0].slug,
          }));
        }
        if (data.sports?.length) {
          const sports = data.sports.map((sport) => ({
            value: sport.code ?? sport.slug,
            label: sport.name,
          }));
          setSportOptions(sports);
          setGameForm((prev) => ({
            ...prev,
            sport: prev.sport || (sports[0]?.value ?? ""),
          }));
        }
        if (data.abilities?.length) {
          const abilities = data.abilities.map((ability) => ({
            value: ability.name,
            label: ability.name,
          }));
          setAbilityOptions(abilities);
          setGameForm((prev) => ({
            ...prev,
            skill: prev.skill || (abilities[0]?.value ?? ""),
          }));
        }
        if (data.genders?.length) {
          const genders = data.genders.map((gender) => ({
            value: gender.name,
            label: gender.name,
          }));
          setGenderOptions(genders);
          setGameForm((prev) => ({
            ...prev,
            gender: prev.gender || (genders[0]?.value ?? ""),
          }));
        }
      } catch (error) {
        console.error("Failed to load reference data", error);
      }
    };

    loadReferenceData();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setExistingOrganizer(null);
      return;
    }

    let cancelled = false;
    const loadOrganizer = async () => {
      setIsOrganizerCheckInFlight(true);
      try {
        const organiser = await getMyOrganizer();
        if (cancelled) return;
        setExistingOrganizer(organiser);
        setOrganiserForm({
          sports: organiser.sports.join(", "),
          experience: organiser.experience ?? "",
          slug: organiser.slug ?? "",
        });
      } catch (error) {
        if (!cancelled) {
          setExistingOrganizer(null);
        }
      } finally {
        if (!cancelled) {
          setIsOrganizerCheckInFlight(false);
        }
      }
    };

    loadOrganizer();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const openOrganiserFlow = () => {
    if (isOrganizerCheckInFlight) {
      toast({
        title: "One moment",
        description: "Checking your organiser profile…",
      });
      return;
    }

    if (existingOrganizer) {
      setIsCreateGameOpen(true);
      return;
    }

    setIsOrganiserModalOpen(true);
  };

  const handleOrganiserContinue = () => {
    if (!organiserForm.sports.trim() || !organiserForm.slug.trim()) {
      toast({
        title: "Tell us more",
        description: "Share the sport you’re hosting and a unique organiser link.",
        variant: "destructive",
      });
      return;
    }
    setOrganiserForm((prev) => ({ ...prev, slug: formattedSlug }));
    setIsOrganiserModalOpen(false);
    setIsGuidanceOpen(true);
  };

  const handleGuidanceNext = () => {
    setIsGuidanceOpen(false);
    setIsCreateGameOpen(true);
  };

  const cityLabelBySlug = useMemo(
    () => Object.fromEntries(cityOptions.map((option) => [option.value, option.label])),
    [cityOptions]
  );

  const sportLabelByCode = useMemo(
    () => Object.fromEntries(sportOptions.map((option) => [option.value, option.label])),
    [sportOptions]
  );

  const abilityLabelByValue = useMemo(
    () => Object.fromEntries(abilityOptions.map((option) => [option.value, option.label])),
    [abilityOptions]
  );

  const genderLabelByValue = useMemo(
    () => Object.fromEntries(genderOptions.map((option) => [option.value, option.label])),
    [genderOptions]
  );

  const handleGamePreview = () => {
    if (
      !gameForm.name.trim() ||
      !gameForm.venue.trim() ||
      !gameForm.sport.trim() ||
      !gameForm.city ||
      !gameForm.skill ||
      !gameForm.gender
    ) {
      toast({
        title: "Game details incomplete",
        description: "Add at least a name, venue, city, sport, skill level, and gender to preview your game.",
        variant: "destructive",
      });
      return;
    }
    if (!gameForm.date || !gameForm.startTime || !gameForm.endTime) {
      toast({
        title: "Timing required",
        description: "Add a date, start time, and end time for your game.",
        variant: "destructive",
      });
      return;
    }
    setIsCreateGameOpen(false);
    setIsPreviewOpen(true);
  };

  const handleSubmitGame = async () => {
    if (!gameForm.date || !gameForm.startTime || !gameForm.endTime) {
      toast({
        title: "Add timing details",
        description: "Please fill in the date and time before submitting.",
        variant: "destructive",
      });
      return;
    }

    const playersCount = parseInt(gameForm.players, 10);
    if (!Number.isFinite(playersCount) || playersCount <= 0) {
      toast({
        title: "Number of players",
        description: "Add how many players can join this session.",
        variant: "destructive",
      });
      return;
    }

    const parsedPrice = gameForm.price ? parseFloat(gameForm.price) : null;
    const priceValue = parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null;

    try {
      setIsSubmitting(true);
      if (!user?.id) {
        throw new Error("You need to be logged in to host a game.");
      }

      const sportsList = organiserForm.sports
        .split(/,|\n/)
        .map((sport) => sport.trim())
        .filter(Boolean);
      const experienceText = organiserForm.experience.trim();
      const uniqueLink = formattedSlug
        ? `https://playbud.app/organisers/${formattedSlug}`
        : undefined;

      let organiserRecord = existingOrganizer;
      if (!organiserRecord) {
        organiserRecord = await ensureOrganizer({
          user_id: user.id,
          slug: formattedSlug || undefined,
          sports: sportsList,
          experience: experienceText || undefined,
          unique_link: uniqueLink,
        });
        setExistingOrganizer(organiserRecord);
        setOrganiserForm({
          sports: organiserRecord.sports.join(", "),
          experience: organiserRecord.experience ?? "",
          slug: organiserRecord.slug ?? "",
        });
      }
      const payload = {
        organiser_id: organiserRecord.id,
        name: gameForm.name.trim(),
        venue: gameForm.venue.trim(),
        city_slug: gameForm.city,
        sport_code: gameForm.sport,
        date: new Date(`${gameForm.date}T00:00:00`).toISOString(),
        start_time: normalizeTime(gameForm.startTime),
        end_time: normalizeTime(gameForm.endTime),
        skill: gameForm.skill,
        gender: gameForm.gender,
        players: playersCount,
        description: gameForm.description.trim() || undefined,
        rules: gameForm.rules.trim() || undefined,
        frequency: gameForm.frequency,
        price: priceValue,
        is_private: gameForm.isPrivate,
        cancellation: gameForm.cancellation,
        team_sheet: gameForm.teamSheet,
      } as const;

      await createGame(payload);
      toast({
        title: "Game submitted",
        description: "We'll review your details and share next steps shortly.",
      });
      setIsPreviewOpen(false);
      setIsCreateGameOpen(false);
      setGameForm({
        ...defaultGameForm,
        city: cityOptions[0]?.value ?? "",
        sport: sportOptions[0]?.value ?? "",
        skill: abilityOptions[0]?.value ?? "",
        gender: genderOptions[0]?.value ?? "",
      });
      navigate("/find-game");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Failed to submit game",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.25em] text-primary">
                For organisers
              </span>
              <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
                Get the best out of your sports game for you &amp; your community
              </h1>
              <p className="text-base text-muted-foreground">
                Sportas makes it simple to host recurring sessions: publish in minutes, manage player lists and let us handle the admin.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" className="rounded-full px-8" onClick={openOrganiserFlow}>
                  Add your game
                </Button>
                {/* <div className="flex flex-col text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Get Sportas on your phone. It’s free!</span>
                  <div className="flex items-center gap-3 text-sm font-medium text-primary/80">
                    <span>App Store ⭐ 4.7</span>
                    <span>Google Play ⭐ 4.8</span>
                  </div>
                </div> */}
              </div>
            </div>
            <div className="relative flex justify-center">
              <div className="relative w-full overflow-hidden rounded-[48px] border border-border shadow-lg">
                <img src={organiserImage} alt="Organisers" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-background">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16 md:flex-row md:items-start md:justify-between">
            <div className="md:w-1/3">
              <h2 className="text-3xl font-semibold text-foreground">Why Sportas?</h2>
              <p className="mt-4 text-sm text-muted-foreground">
                With a guided booking flow and tools built specifically for organisers, you stay in control while saving hours of admin every week.
              </p>
            </div>
            <div className="grid flex-1 gap-4 md:grid-cols-3">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="rounded-3xl border-border/60 bg-card/80 shadow-sm">
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <benefit.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-16 md:flex-row">
            <div className="relative w-full max-w-sm overflow-hidden rounded-[140px] border border-border">
              <img
                src="https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80"
                alt="Organiser testimonial"
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                PB Dodgeball
              </span>
            </div>
            <div className="space-y-6 text-center md:text-left">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                What organisers say
              </p>
              <p className="text-2xl font-semibold text-foreground">
                “Sportas is really easy to use. We run all of our sessions through it and love seeing who’s signed up before we get to the venue.”
              </p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Josh</p>
                <button className="text-primary underline-offset-4 hover:underline">PB Dodgeball →</button>
              </div>
              <Button className="rounded-full px-6" onClick={openOrganiserFlow}>
                Add your game
              </Button>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="bg-background">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-16">
            <h2 className="text-center text-3xl font-semibold text-foreground">How it works</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card/70 p-8 text-center shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-primary">Step {step.number}</span>
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-16">
            <h2 className="text-3xl font-semibold">FAQs</h2>
            <div className="space-y-4 text-sm text-primary-foreground">
              {faqs.map((faq) => (
                <details key={faq.question} className="group rounded-2xl bg-primary-foreground/10 p-4">
                  <summary className="cursor-pointer text-lg font-semibold">{faq.question}</summary>
                  <p className="mt-2 text-sm text-primary-foreground/80">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      

      {/* Modals */}
      <Dialog open={isOrganiserModalOpen} onOpenChange={setIsOrganiserModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-semibold text-foreground">
              Become an organiser
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Great to see you’re ready to host! Share a few details so we can tailor the onboarding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organiser-sports">Sports you want to organise</Label>
              <Input
                id="organiser-sports"
                value={organiserForm.sports}
                onChange={(event) => setOrganiserForm((prev) => ({ ...prev, sports: event.target.value }))}
                placeholder="e.g. Dodgeball, Volleyball"
                className="h-11 rounded-xl border-2 border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organiser-experience">Your experience running games</Label>
              <Textarea
                id="organiser-experience"
                value={organiserForm.experience}
                onChange={(event) => setOrganiserForm((prev) => ({ ...prev, experience: event.target.value }))}
                placeholder="Tell us about your club or sessions so far."
                className="min-h-[110px] rounded-2xl border-2 border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organiser-slug">Create a unique organiser link</Label>
              <Input
                id="organiser-slug"
                value={organiserForm.slug}
                onChange={(event) => setOrganiserForm((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="e.g. pbdodgeball"
                className="h-11 rounded-xl border-2 border-border focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                https://playbud.app/organisers/<span className="font-semibold">{formattedSlug || "your-team"}</span>
              </p>
            </div>
          </div>
          <Button className="h-11 rounded-full" onClick={handleOrganiserContinue}>
            Continue
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isGuidanceOpen} onOpenChange={setIsGuidanceOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-semibold text-foreground">
              New game checklist
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Please read this before submitting a request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 text-sm text-muted-foreground">
            <div className="space-y-2">
              <span className="text-lg">🏟️ Venue booking</span>
              <p>Book the court or pitch directly with the venue first. Sportas doesn’t arrange venue rentals.</p>
            </div>
            <div className="space-y-2">
              <span className="text-lg">🤝 Exclusivity</span>
              <p>Ask players to book via Sportas so the team sheet stays accurate and you can communicate easily.</p>
            </div>
            <div className="space-y-2">
              <span className="text-lg">📸 Make it attractive</span>
              <p>Add a welcoming picture and description – it helps new players feel confident joining.</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" className="rounded-full" onClick={() => setIsGoodExampleOpen(true)}>
              See good example
            </Button>
            <Button className="rounded-full" onClick={handleGuidanceNext}>
              Next
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateGameOpen} onOpenChange={setIsCreateGameOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0">
          <DialogHeader className="border-b border-border px-6 py-4 text-left">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Create game
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Provide details for the session you’d like to list.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
            {/* <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">Is this a league or tournament?</span>
                <span className="text-xs text-muted-foreground">Toggle on if you’re planning a multi-week run.</span>
              </div>
              <Switch disabled />
            </div> */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="game-name">Game name</Label>
                <Input
                  id="game-name"
                  value={gameForm.name}
                  onChange={(event) => setGameForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Hackney Social Volleyball"
                  className="h-11 rounded-xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="game-venue">Venue address</Label>
                <Input
                  id="game-venue"
                  value={gameForm.venue}
                  onChange={(event) => setGameForm((prev) => ({ ...prev, venue: event.target.value }))}
                  placeholder="e.g. Copper Box Arena, Queen Elizabeth Olympic Park"
                  className="h-11 rounded-xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="game-city">City</Label>
                <Select
                  value={gameForm.city}
                  onValueChange={(value) => setGameForm((prev) => ({ ...prev, city: value }))}
                >
                  <SelectTrigger
                    id="game-city"
                    className="h-11 rounded-xl border-2 border-border focus:border-primary"
                  >
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="game-sport">Sport</Label>
                <Select
                  value={gameForm.sport}
                  onValueChange={(value) => setGameForm((prev) => ({ ...prev, sport: value }))}
                >
                  <SelectTrigger id="game-sport" className="h-11 rounded-xl border-2 border-border focus:border-primary">
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sportOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="game-date">Date</Label>
                <Input
                  id="game-date"
                  type="date"
                  value={gameForm.date}
                  onChange={(event) => setGameForm((prev) => ({ ...prev, date: event.target.value }))}
                  className="h-11 rounded-xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>Start time</Label>
                <Input
                  type="time"
                  value={gameForm.startTime}
                  onChange={(event) => setGameForm((prev) => ({ ...prev, startTime: event.target.value }))}
                  className="h-11 rounded-xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>End time</Label>
                <Input
                  type="time"
                  value={gameForm.endTime}
                  onChange={(event) => setGameForm((prev) => ({ ...prev, endTime: event.target.value }))}
                  className="h-11 rounded-xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>Skill level</Label>
                <Select
                  value={gameForm.skill}
                  onValueChange={(value) => setGameForm((prev) => ({ ...prev, skill: value }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-2 border-border focus:border-primary">
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    {abilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={gameForm.gender}
                  onValueChange={(value) => setGameForm((prev) => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-2 border-border focus:border-primary">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="game-players">Number of players</Label>
                <Input
                  id="game-players"
                  type="number"
                  min={2}
                  value={gameForm.players}
                  onChange={(event) => setGameForm((prev) => ({ ...prev, players: event.target.value }))}
                  className="h-11 rounded-xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={gameForm.description}
                  onChange={(event) => setGameForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Describe the vibe, format, and any requirements for your session."
                  className="min-h-[100px] rounded-2xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Rules / Checklist</Label>
                <Textarea
                  value={gameForm.rules}
                  onChange={(event) => setGameForm((prev) => ({ ...prev, rules: event.target.value }))}
                  placeholder="e.g. Arrive 10 minutes early, indoor trainers only, bring water."
                  className="min-h-[80px] rounded-2xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={gameForm.frequency}
                  onValueChange={(value) => setGameForm((prev) => ({ ...prev, frequency: value as "one-off" | "recurring" }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-2 border-border focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-off">One-off</SelectItem>
                    <SelectItem value="recurring">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Event visibility</Label>
                <Select
                  value={gameForm.isPrivate ? "Private" : "Public"}
                  onValueChange={(value) => setGameForm((prev) => ({ ...prev, isPrivate: value === "Private" }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-2 border-border focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Public">Public</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price per player (₦)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={gameForm.price}
                  onChange={(event) => setGameForm((prev) => ({ ...prev, price: event.target.value }))}
                  className="h-11 rounded-xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Cancellation policy</Label>
                <Select
                  value={gameForm.cancellation}
                  onValueChange={(value) => setGameForm((prev) => ({ ...prev, cancellation: value }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-2 border-border focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24 Hours">24 Hours</SelectItem>
                    <SelectItem value="48 Hours">48 Hours</SelectItem>
                    <SelectItem value="72 Hours">72 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4 sm:col-span-2">
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">Add yourself to the team sheet?</p>
                  <p className="text-xs text-muted-foreground">
                    We’ll count you towards capacity and let players know the host is playing too.
                  </p>
                </div>
                <Switch
                  checked={gameForm.teamSheet}
                  onCheckedChange={(checked) => setGameForm((prev) => ({ ...prev, teamSheet: checked }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" className="rounded-full" onClick={() => setIsGoodExampleOpen(true)}>
                See good example
              </Button>
              <Button className="rounded-full" onClick={handleGamePreview}>
                Preview game
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-semibold text-foreground">Game preview</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Double-check everything looks right before submitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm text-muted-foreground">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">{gameForm.name || "Untitled game"}</p>
                <p>{cityLabelBySlug[gameForm.city] || "City"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{sportLabelByCode[gameForm.sport] || "Sport"}</p>
                <p>
                  {abilityLabelByValue[gameForm.skill] || gameForm.skill || "Skill"}
                  {" · "}
                  {genderLabelByValue[gameForm.gender] || gameForm.gender || "Gender"}
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-2xl border border-border bg-muted/30 p-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{gameForm.date || "Date to confirm"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  {gameForm.startTime || "--:--"} – {gameForm.endTime || "--:--"}
                </span>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="line-clamp-2">{gameForm.venue || "Venue address"}</span>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <Users className="h-4 w-4 text-primary" />
                <span>{Number(gameForm.players) || 0} players · {gameForm.frequency === "recurring" ? "Weekly" : "One off"}</span>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">Description</h3>
              <p>{gameForm.description || "Add a welcoming overview so players know what to expect."}</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">Rules</h3>
              <p>{gameForm.rules || "Outline any house rules, arrival notes or equipment requirements."}</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">Pricing &amp; visibility</h3>
              <p>{gameForm.price ? `₦${gameForm.price} per player` : "Add pricing so players know what to expect."}</p>
              <p>Cancellation policy: {gameForm.cancellation}</p>
              <p>{gameForm.isPrivate ? "Private event" : "Public listing"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setIsPreviewOpen(false);
                setIsCreateGameOpen(true);
              }}
            >
              Edit details
            </Button>
            <Button className="rounded-full" onClick={handleSubmitGame} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit for review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGoodExampleOpen} onOpenChange={setIsGoodExampleOpen}>
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-semibold text-foreground">Good example</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Clean imagery and warm copy help new players feel confident joining.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <img
              src="https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=80"
              alt="Example listing"
              className="h-48 w-full rounded-2xl object-cover"
            />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">Casual / Social Volleyball</p>
              <p>Hosted by Sportas · Mixed ability · Stratford</p>
              <p>
                “Join us for a relaxed session focused on rallying, improving together and cheering each other on. First-timers welcome!”
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AppFooter />
    </div>
    </div>
  
);
};

export default AddGame;
