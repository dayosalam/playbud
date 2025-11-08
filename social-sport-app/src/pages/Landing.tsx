import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Users,
  Trophy,
  Shield,
  Calendar,
  Clock,
  Star,
  Apple,
  Play,
  Instagram,
  Linkedin,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import landOne from "@/assets/land_picture_one.png";
import { useAuth } from "@/contexts/AuthContext";
import { fetchReferenceData } from "@/services/reference.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { submitFeedback } from "@/services/feedback.service";


const Landing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const userName = user?.name || "Player";

  const [sports, setSports] = useState<Array<{ label: string; code: string }>>([
    { label: "Basketball", code: "BASKETBALL" },
    { label: "Football", code: "FOOTBALL" },
    { label: "Volleyball", code: "VOLLEYBALL" },
    { label: "Tennis", code: "TENNIS" },
  ]);

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    rating: "5",
    message: "",
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const testimonials = [
    {
      name: "Dayo Salam",
      time: "1 month ago",
      rating: 5,
      text: "I've been using PlayBud for just a month now and I have played over 5 games. Great community!",
      avatar: "DS"
    },
    {
      name: "Attah Macanthony",
      time: "1 month ago",
      rating: 5,
      text: "Such a fun game of football every time I play I play with new people and I always have a great time :)",
      avatar: "AM"
    },
    {
      name: "Owad Abdulwahab",
      time: "1 month ago",
      rating: 5,
      text: "PlayBud aka the home of sports in the Nigeria! I get my daily Basketball fix here 🔥",
      avatar: "OA"
    }
  ];

  const primaryCtaLabel = isAuthenticated ? "Find games" : "Get Started Free";
  const primaryCtaHandler = () =>
    isAuthenticated ? navigate("/find-game") : navigate("/auth?mode=signup");
  const secondaryCtaLabel = isAuthenticated ? "Host a game" : "Browse Games";
  const secondaryCtaHandler = () =>
    isAuthenticated ? navigate("/add-game") : navigate("/find-game");

  useEffect(() => {
    let cancelled = false;
    const loadSports = async () => {
      try {
        const data = await fetchReferenceData();
        if (cancelled) return;
        if (data.sports?.length) {
          setSports(
            data.sports.map((sport) => ({
              label: sport.name,
              code: (sport.code ?? sport.slug ?? sport.name).toUpperCase(),
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load sports", error);
      }
    };
    loadSports();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSportClick = (code: string) => {
    navigate(`/find-game?sport=${encodeURIComponent(code)}`);
  };
  const handleFeedbackSubmit = async () => {
    if (!feedbackForm.name.trim() || !feedbackForm.email.trim() || !feedbackForm.message.trim()) {
      toast({
        title: "Missing details",
        description: "Please provide your name, email, and feedback message.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        name: feedbackForm.name.trim(),
        email: feedbackForm.email.trim(),
        rating: Number(feedbackForm.rating),
        message: feedbackForm.message.trim(),
      });
      toast({
        title: "Thank you!",
        description: "Your feedback helps improve the PlayBud experience.",
      });
      setFeedbackForm({ name: "", email: "", rating: "5", message: "" });
      setIsFeedbackDialogOpen(false);
    } catch (error) {
      console.error("Failed to submit feedback", error);
      toast({
        title: "Submission failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {isAuthenticated ? (
        <AppHeader showPrimaryCTA={false} />
      ) : (
        <header className="border-b border-border">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">
                PLAY<span className="text-primary">BUD</span>
              </span>
            </div>
            <nav className="hidden items-center gap-6 md:flex">
              <button
                type="button"
                onClick={() => navigate("/find-game")}
                className="text-foreground transition-colors hover:text-primary"
              >
                Find a game
              </button>
              <button
                type="button"
                onClick={() => navigate("/add-game")}
                className="text-foreground transition-colors hover:text-primary"
              >
                Add your game
              </button>
              <button
                type="button"
                onClick={() => navigate("/company-events")}
                className="text-foreground transition-colors hover:text-primary"
              >
                Company events
              </button>
            </nav>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sign up
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-slide-up">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  {isAuthenticated ? (
                    <>
                      Welcome back, <span className="text-primary">{userName.split(" ")[0]}!</span>
                    </>
                  ) : (
                    <>
                      Play or organise sports games,{" "}
                      <span className="text-primary">we'll handle the rest.</span>
                    </>
                  )}
                </h1>
                <p className="text-xl text-muted-foreground">
                  {isAuthenticated
                    ? "Jump straight into nearby sessions or host your own in minutes."
                    : "Discover sports sessions near you. Join verified hosts, earn achievements, and compete on leaderboards."}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    onClick={primaryCtaHandler}
                    className="bg-primary text-primary-foreground text-lg px-8 hover:bg-primary/90"
                  >
                    {primaryCtaLabel}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={secondaryCtaHandler}
                    className="text-lg px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    {secondaryCtaLabel}
                  </Button>
                </div>
              </div>
              <div className="relative h-[400px] rounded-lg overflow-hidden shadow-lg animate-slide-in">
              <div className="absolute inset-0 bg-gradient-primary opacity-0 z-10"></div>
              <img
                src={landOne} // import your image at the top if it’s in src/assets
                alt="Basketball team"
                className="w-full h-full object-cover"
              />
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Categories */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {sports.map((sport) => (
                <button
                  key={sport.code}
                  className="px-6 py-3 rounded-full border-2 border-border hover:border-primary hover:bg-accent transition-all duration-300 font-medium"
                  onClick={() => handleSportClick(sport.code)}
                >
                  {sport.label}
                </button>
              ))}
            </div>
            <div className="text-center">
              <Button 
                onClick={() => navigate("/find-game")}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Play Games
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      {/* <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Featured Games
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-primary"></div>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold text-lg">Mid-Intermediate Volleyball</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Friday, 24 Oct 2025</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>6:00pm - 8:00pm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Community Sports Centre</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">15 joined</span>
                    </div>
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      Full
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Why PlayBud */}
      <section className="py-20">
  <div className="container mx-auto px-4">
    <div className="mx-auto max-w-6xl">
      {/* Two-column layout: left = centered heading, right = copy */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-16">
        {/* Left: centered heading */}
        <div className="flex justify-center md:justify-center text-center md:text-center">
          <h2 className="text-5xl font-bold tracking-tight">
            Why <span className="text-primary">PlayBud?</span>
          </h2>
        </div>

        {/* Right: text-only list */}
        <div className="text-left">
          <ul className="space-y-2 text-xl leading-relaxed">
            <li>Weekly games by some of the best organisers in the country</li>
            <li>Flexible times to fit around your schedule</li>
            <li>Pristine venues with all equipment provided</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* Community Stats */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-4">
              Building a <span className="text-primary">Community</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="relative h-[300px] rounded-lg overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-primary opacity-20"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl font-bold text-primary mb-2">1,000+</div>
                  <div className="text-2xl font-semibold">Hours Exercised</div>
                </div>
              </div>
              <div className="relative h-[300px] rounded-lg overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-achievement opacity-20"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl font-bold text-achievement mb-2">20+</div>
                  <div className="text-2xl font-semibold">Nationalities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">
            What our customers say
          </h2>
          <div className="max-w-5xl mx-auto">
            <div className="bg-muted/50 rounded-lg p-6 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold">4.9</div>
                <div>
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">Based on 80 reviews</div>
                </div>
              </div>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setIsFeedbackDialogOpen(true)}
              >
                Leave a Review
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.time}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{testimonial.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* App Download */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              See which games your friends are joining!
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Get access to in-game highlights & book games for you and your friends.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                variant="outline"
                className="bg-background text-foreground hover:bg-background/90 border-0"
                onClick={() => navigate("/coming-soon")}
              >
                <Apple className="w-5 h-5 mr-2" />
                App Store
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="bg-background text-foreground hover:bg-background/90 border-0"
                onClick={() => navigate("/coming-soon")}
              >
                <Play className="w-5 h-5 mr-2" />
                Google Play
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <AppFooter />

      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-foreground">
              Share your experience
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Let us know how PlayBud is working for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-name">Name</Label>
              <Input
                id="feedback-name"
                value={feedbackForm.name}
                onChange={(event) => setFeedbackForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-email">Email</Label>
              <Input
                id="feedback-email"
                type="email"
                value={feedbackForm.email}
                onChange={(event) => setFeedbackForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
  <Label htmlFor="feedback-rating">Rating</Label>
  <div className="flex items-center gap-2">
    {[1, 2, 3, 4, 5].map((value) => {
      const isActive = value <= Number(feedbackForm.rating);
      return (
        <button
          key={value}
          type="button"
          aria-label={`${value} star${value > 1 ? "s" : ""}`}
          className={`rounded-full p-1 transition-colors ${
            isActive ? "text-primary" : "text-gray-300"
          }`}
          onClick={() =>
            setFeedbackForm((prev) => ({
              ...prev,
              rating: String(value),
            }))
          }
        >
          <Star
            className="h-6 w-6"
            fill={isActive ? "currentColor" : "white"}
            stroke="currentColor"
          />
        </button>
      );
    })}
  </div>
</div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Feedback</Label>
              <Textarea
                id="feedback-message"
                rows={4}
                value={feedbackForm.message}
                onChange={(event) => setFeedbackForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Share your thoughts..."
              />
            </div>
            <Button
              className="w-full rounded-full"
              onClick={handleFeedbackSubmit}
              disabled={isSubmittingFeedback}
            >
              {isSubmittingFeedback ? "Sending…" : "Submit feedback"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Landing;
