import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CompanyEvents = () => {
  const navigate = useNavigate();
  const email = "ballerz@playbud.site";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col gap-10 px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-primary">PlayBud</p>
      <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
        Company events coming soon
      </h1>
      <p className="text-base leading-relaxed text-muted-foreground">
        We&apos;re crafting tailored sport experiences for teams, off-sites, and company celebrations.
        While we finalise the booking experience, let us know what you have in mind and we&apos;ll help set it up.
      </p>
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button
          className="rounded-full px-6"
          onClick={() => (window.location.href = `mailto:${email}?subject=PlayBud%20Company%20Events`)}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email us {email}
        </Button>
        <Button
          variant="outline"
          className="rounded-full px-6"
          onClick={() => navigate("/find-game")}
        >
          Explore games
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Prefer a quick chat? Drop us a line and we&apos;ll schedule a call to plan your next company meetup.
      </p>
    </div>
  );
};

export default CompanyEvents;
