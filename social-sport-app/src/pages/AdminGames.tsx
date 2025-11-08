import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchAllGames,
  fetchGameDetail,
  updateGameStatus,
  type AdminGameDetail,
  type GameStatus,
} from "@/services/admin.service";
import type { GameResponse } from "@/services/games.service";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((value: string) => value.trim().toLowerCase())
  .filter(Boolean);

const statusOptions: GameStatus[] = ["pending", "confirmed", "unapproved", "completed"];

const AdminGames = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const isAllowed = useMemo(() => {
    if (!user?.email) return false;
    if (ADMIN_EMAILS.length === 0) return true;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  }, [user?.email]);

  const [games, setGames] = useState<GameResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<GameStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detail, setDetail] = useState<AdminGameDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadGames = async (status?: GameStatus) => {
    setIsLoading(true);
    try {
      const data = await fetchAllGames(status);
      setGames(data);
    } catch (error) {
      console.error("Failed to load games", error);
      toast({
        title: "Unable to load games",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAllowed) {
      loadGames(filterStatus === "all" ? undefined : filterStatus);
    }
  }, [isAllowed, filterStatus]);

  const handleStatusChange = async (gameId: string, status: GameStatus) => {
    setUpdatingId(gameId);
    try {
      const updated = await updateGameStatus(gameId, status);
      setGames((prev) => prev.map((game) => (game.id === gameId ? updated : game)));
      toast({
        title: "Status updated",
        description: `${updated.name} is now ${status}.`,
      });
    } catch (error) {
      console.error("Failed to update status", error);
      toast({
        title: "Update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewDetails = async (gameId: string) => {
    setIsDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const response = await fetchGameDetail(gameId);
      setDetail(response);
    } catch (error) {
      console.error("Failed to load game detail", error);
      toast({
        title: "Unable to load details",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  if (!isAllowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <Card className="w-full max-w-lg p-10 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Access restricted</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Company events and moderation tools are currently limited to admins.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-primary">PlayBud</p>
          <h1 className="text-3xl font-semibold text-foreground">Game moderation</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={filterStatus}
            onValueChange={(value: GameStatus | "all") => setFilterStatus(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadGames(filterStatus === "all" ? undefined : filterStatus)}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        {games.map((game) => (
          <Card key={game.id} className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{game.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {game.venue} • {game.city_slug} • {format(new Date(game.date), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Created by {game.created_by_user_id ?? "N/A"} • Status:{" "}
                  <span className="font-semibold capitalize">{game.status}</span>
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:w-auto">
                <Select
                  value={game.status}
                  onValueChange={(value: GameStatus) => handleStatusChange(game.id, value)}
                  disabled={updatingId === game.id}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => handleViewDetails(game.id)}>
                  View details
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {!games.length && !isLoading && (
          <p className="text-center text-sm text-muted-foreground">No games found for this filter.</p>
        )}
      </div>

      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setDetail(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-foreground">
              Game overview
            </DialogTitle>
          </DialogHeader>
          {detailLoading && <p className="text-sm text-muted-foreground">Loading details…</p>}
          {!detailLoading && detail && (
            <div className="space-y-6">
              <section className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">{detail.game.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {detail.game.venue} • {detail.game.city_slug}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="font-semibold capitalize">{detail.game.status}</span> • Sport: {detail.game.sport_code}
                </p>
                <p className="text-xs text-muted-foreground">
                  Date: {format(new Date(detail.game.date), "EEE, MMM d yyyy")} • Time: {detail.game.start_time} - {detail.game.end_time}
                </p>
                <p className="text-xs text-muted-foreground">
                  Slots: {detail.game.players} players • Cancellation: {detail.game.cancellation}
                </p>
              </section>

              <Separator />

              <section className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-foreground">Creator</h3>
                  {detail.creator ? (
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="text-foreground">{detail.creator.name ?? detail.creator.email}</p>
                      <p>{detail.creator.email}</p>
                      {detail.creator.preferred_city && <p>City: {detail.creator.preferred_city}</p>}
                      {detail.creator.heard_about && <p>Heard about: {detail.creator.heard_about}</p>}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No creator data available.</p>
                  )}
                </Card>
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-foreground">Organizer</h3>
                  {detail.organizer ? (
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="text-foreground">Organizer ID: {detail.organizer.id}</p>
                      {detail.organizer.slug && <p>Slug: {detail.organizer.slug}</p>}
                      {detail.organizer.sports.length > 0 && (
                        <p>Sports: {detail.organizer.sports.join(", ")}</p>
                      )}
                      {detail.organizer.experience && <p>Experience: {detail.organizer.experience}</p>}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No organizer record.</p>
                  )}
                </Card>
              </section>

              <Separator />

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Participants</h3>
                  <span className="text-xs text-muted-foreground">
                    {detail.participants.length} joined
                  </span>
                </div>
                {detail.participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No participants yet.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.participants.map((participant) => (
                      <div
                        key={participant.booking_id}
                        className="flex items-center justify-between rounded-2xl border border-border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {participant.user?.name ?? "PlayBud Member"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {format(new Date(participant.joined_at), "MMM d, yyyy h:mma")}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{participant.user?.id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGames;
