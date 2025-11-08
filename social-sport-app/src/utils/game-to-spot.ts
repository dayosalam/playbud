import fallbackImage from "@/assets/land_picture_one.png";
import type { Spot } from "@/data/spots";
import type { GameResponse } from "@/services/games.service";

export interface CityLookup {
  label: string;
  center?: [number, number];
  radiusKm?: number;
}

export interface SpotTransformLookups {
  cityMap: Map<string, CityLookup>;
  sportMap: Map<string, string>;
  abilityMap: Map<string, string>;
  genderMap: Map<string, string>;
}

const DEFAULT_CENTER: [number, number] = [-0.118092, 51.509865];

const defaultDescriptionPoints = [
  "Hosted session led by friendly local organisers.",
  "Secure a spot early and meet players at a similar level.",
  "All skill levels welcome – bring a positive vibe and energy.",
];

const defaultRules = [
  "Arrive 10 minutes early to warm up and meet everyone.",
  "Respect fellow players and rotate so everyone gets game time.",
  "Let the organiser know if you can no longer attend.",
];

const defaultLocationNote = "Exact venue details shared after confirmation.";

function combineDateAndTime(dateIso: string, time: string | undefined): Date {
  const base = new Date(dateIso);
  if (time) {
    const [hours, minutes] = time.split(":").map((value) => Number(value) || 0);
    base.setHours(hours, minutes, 0, 0);
  }
  return base;
}

const getInitials = (value: string | undefined, fallback: string) => {
  if (!value) {
    return fallback;
  }
  const initials = value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
  return initials || fallback;
};

export function gameToSpot(game: GameResponse, lookups: SpotTransformLookups): Spot {
  const city = lookups.cityMap.get(game.city_slug);
  const [lng, lat] = city?.center ?? DEFAULT_CENTER;

  const sportLabel = lookups.sportMap.get(game.sport_code) ?? game.sport_code?.toUpperCase() ?? "SPORT";
  const abilityLabel = lookups.abilityMap.get(game.skill) ?? game.skill ?? "All levels";
  const genderLabel = lookups.genderMap.get(game.gender) ?? game.gender ?? "Mixed";

  const startTime = combineDateAndTime(game.date, game.start_time);
  const endTime = combineDateAndTime(game.date, game.end_time);
  const durationMinutes = Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 60000));

  const priceCents = game.price != null ? Math.round(game.price * 100) : undefined;
  const isPaid = !!priceCents;

  const participantCount =
    game.participants?.length ?? game.participant_user_ids?.length ?? 0;
  const capacity = game.players ?? 0;
  const slotsLeft = Math.max(capacity - participantCount, 0);
  const participantPlayers =
    (game.participants && game.participants.length > 0
      ? game.participants.map((participant, index) => {
          const fallbackName = `Player ${index + 1}`;
          const name = participant.name ?? fallbackName;
          return {
            id: participant.id,
            name,
            initials: getInitials(participant.name, `P${index + 1}`),
            avatarUrl: participant.avatar_url ?? undefined,
          };
        })
      : (game.participant_user_ids ?? []).map((participantId, index) => ({
          id: participantId,
          name: `Player ${index + 1}`,
          initials: `P${index + 1}`,
        })));

  const cleanDescription = game.description?.trim();
  const descriptionPoints = cleanDescription
    ? cleanDescription.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    : defaultDescriptionPoints;

  const cleanRules = game.rules?.trim();
  const rules = cleanRules
    ? cleanRules.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    : defaultRules;

  const locationNotes = city
    ? [`Happening in ${city.label}`]
    : [defaultLocationNote];

  return {
    id: game.id,
    sportCode: game.sport_code?.toUpperCase() ?? "SPORT",
    title: game.name,
    description: cleanDescription || "Join fellow players for an exciting community-run session.",
    address: game.venue,
    city: city?.label ?? game.city_slug,
    lat,
    lng,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMinutes,
    capacity: game.players ?? 0,
    slotsLeft,
    isPaid,
    priceCents,
    currency: priceCents ? "GBP" : undefined,
    hostName: sportLabel ? `${sportLabel} Host` : "PlayBud Host",
    hostHandle: "@playbud",
    skillLevel: abilityLabel,
    gender: genderLabel,
    abilityLevel: abilityLabel,
    coverImage: fallbackImage,
    gallery: [fallbackImage],
    descriptionPoints,
    extraNotes: game.team_sheet ? ["Host is playing too – team sheet includes organiser."] : [],
    rules,
    locationNotes,
    cancellationPolicy: game.cancellation || "Please contact the organiser for the latest cancellation policy.",
    players: participantPlayers,
  };
}
