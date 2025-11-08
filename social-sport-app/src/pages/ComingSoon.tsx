import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-primary">PlayBud</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Coming Soon</h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        Our mobile experience is almost ready. You&apos;ll soon be able to discover games,
        chat with players, and get instant updates on the go. In the meantime, you can find
        and host games directly on the web.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button className="rounded-full px-6" onClick={() => navigate("/find-game")}>
          Browse games
        </Button>
        <Button
          variant="outline"
          className="rounded-full px-6"
          onClick={() => navigate("/add-game")}
        >
          Host a game
        </Button>
      </div>
    </div>
  );
};

export default ComingSoon;
