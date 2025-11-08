import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  category: "system" | "game" | "community";
}

const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "New players joined your game",
    body: "Two players confirmed attendance for Hackney Social Volleyball.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    category: "game",
  },
  {
    id: "n2",
    title: "PlayBud iOS launch",
    body: "The iOS app is nearly ready. Join the waitlist to get early access.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    category: "system",
  },
  {
    id: "n3",
    title: "Community highlight",
    body: "Dodgeball Fridays is now running weekly—grab your spot before it fills.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    category: "community",
  },
];

const categoryStyles: Record<NotificationItem["category"], string> = {
  system: "bg-primary/10 text-primary",
  game: "bg-emerald-100 text-emerald-700",
  community: "bg-amber-100 text-amber-700",
};

const Notifications = () => {
  const notifications = useMemo(() => mockNotifications, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">PlayBud</p>
        <h1 className="text-3xl font-semibold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Stay on top of updates about your games, players, and community news.
        </p>
      </header>

      <div className="space-y-4">
        {notifications.map((notification, index) => (
          <Card key={notification.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${categoryStyles[notification.category]}`}
                  >
                    {notification.category}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-foreground">{notification.title}</h2>
                <p className="text-sm text-muted-foreground">{notification.body}</p>
              </div>
            </div>
            {index < notifications.length - 1 && <Separator className="mt-4 opacity-50" />}
          </Card>
        ))}
        {!notifications.length && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up! We&apos;ll drop a note when there&apos;s something new.
          </Card>
        )}
      </div>
    </div>
  );
};

export default Notifications;
