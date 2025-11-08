import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Favourites = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        {/* <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
          Saved
        </p> */}
        <h1 className="text-3xl font-semibold text-foreground">
          My Favourite Games
        </h1>
        <p className="text-sm text-muted-foreground">
          Click the heart icon on any game to add it to your favourites and it
          will appear here for quick access.
        </p>
      </header>

      <div className="rounded-3xl border border-border bg-card/60 p-10 shadow-sm backdrop-blur-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-3xl border border-dashed border-border bg-muted/30 p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="h-6 w-6" />
            </div>
            <div className="mt-6 space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                Nothing saved yet
              </h2>
              <p className="text-sm text-muted-foreground">
                Browse games, tap the heart icon, and they&apos;ll show up here for
                easy planning.
              </p>
            </div>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => navigate("/find-game")}
                className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline"
              >
                Discover games to favourite
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center rounded-3xl border border-border bg-background/80 p-8 text-center text-sm text-muted-foreground">
            Your saved games will appear here once you start favouriting sessions.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Favourites;
