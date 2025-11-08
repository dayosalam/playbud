import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MapPin,
  Clock,
  Users,
  Heart,
  Signal,
  RefreshCcw,
  Map as MapIcon,
  X,
} from "lucide-react";
import { SpotMap } from "@/components/SpotMap";
import type { Spot } from "@/data/spots";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppFooter } from "@/components/AppFooter";
import {
  fetchReferenceData,
  ReferenceDataResponse,
} from "@/services/reference.service";
import { listGames, GameResponse } from "@/services/games.service";
import { gameToSpot } from "@/utils/game-to-spot";

type CitySelectOption = {
  value: string;
  label: string;
  center: [number, number];
  radiusKm: number;
};

type SelectOption = {
  value: string;
  label: string;
};

type DateFilter = "any" | "today" | "week" | "now";

const dateOptions: Array<{ value: DateFilter; label: string }> = [
  { value: "any", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "now", label: "Happening now" },
];

const mapCityRecordToOption = (
  city: ReferenceDataResponse["cities"][number],
): CitySelectOption => ({
  value: city.slug,
  label: city.name,
  center: [city.center_lng, city.center_lat],
  radiusKm: city.radius_km,
});

const toCityOptions = (cities: ReferenceDataResponse["cities"]): CitySelectOption[] =>
  cities.map(mapCityRecordToOption);

const toSportOptions = (sports: ReferenceDataResponse["sports"]): SelectOption[] => [
  { value: "all", label: "All sports" },
  ...sports.map((sport) => ({
    value: sport.code ?? sport.slug.toUpperCase(),
    label: sport.name,
  })),
];

const toAbilityOptions = (abilities: ReferenceDataResponse["abilities"]): SelectOption[] => [
  { value: "all", label: "All abilities" },
  ...abilities.map((ability) => ({
    value: ability.name,
    label: ability.name,
  })),
];

const toGenderOptions = (genders: ReferenceDataResponse["genders"]): SelectOption[] => [
  { value: "all", label: "Any gender" },
  ...genders.map((gender) => ({
    value: gender.name,
    label: gender.name,
  })),
];

interface Filters {
  city: string;
  sport: string;
  ability: string;
  gender: string;
  date: DateFilter;
  showFullGames: boolean;
  showLeagues: boolean;
}

const INITIAL_FILTERS: Filters = {
  city: "",
  sport: "all",
  ability: "all",
  gender: "all",
  date: "any",
  showFullGames: false,
  showLeagues: false,
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTimeRange = (spot: Spot) => {
  const start = new Date(spot.startTime);
  const end = new Date(spot.endTime);

  const formatOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };

  const startText = start.toLocaleTimeString("en-GB", formatOpts);
  const endText = end.toLocaleTimeString("en-GB", formatOpts);

  return `${startText} - ${endText}`;
};

const formatPrice = (spot: Spot) => {
  if (!spot.isPaid || !spot.priceCents) return "Free";
  const amount = (spot.priceCents / 100).toFixed(0);
  return `₦${Number(amount).toLocaleString()}`;
};

const FindGame = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>({ ...INITIAL_FILTERS });
  const [games, setGames] = useState<GameResponse[]>([]);
  const [isGamesLoading, setIsGamesLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [cityOptions, setCityOptions] = useState<CitySelectOption[]>(toCityOptions([]));
  const [sportOptions, setSportOptions] = useState<SelectOption[]>(toSportOptions([]));
  const [abilityOptions, setAbilityOptions] = useState<SelectOption[]>(toAbilityOptions([]));
  const [genderOptions, setGenderOptions] = useState<SelectOption[]>(toGenderOptions([]));
  const [isReferenceLoading, setIsReferenceLoading] = useState(false);
  const [defaultCity, setDefaultCity] = useState<string>("");

  const loadGames = useCallback(async () => {
    setIsGamesLoading(true);
    try {
      const data = await listGames();
      setGames(data);
    } catch (error) {
      console.error("Failed to load games", error);
    } finally {
      setIsGamesLoading(false);
    }
  }, []);

  const cityMap = useMemo(
    () => new Map(cityOptions.map((option) => [option.value, option])),
    [cityOptions]
  );
  const fallbackCity: CitySelectOption =
    cityOptions[0] ?? {
      value: "all-cities",
      label: "All Cities",
      center: [9.0820, 8.6753] as [number, number],
      radiusKm: 30,
    };
  const activeCity = cityMap.get(filters.city) ?? fallbackCity;
  const isLoading = isRefreshing || isReferenceLoading || isGamesLoading;
  const cityFilterActive = !!filters.city && filters.city !== defaultCity;
  const sportFilterActive = filters.sport !== "all";
  const abilityFilterActive = filters.ability !== "all";
  const genderFilterActive = filters.gender !== "all";
  const dateFilterActive = filters.date !== "any";

  const getFilterTriggerClasses = (isActive: boolean) =>
    cn(
      "h-11 w-auto flex-1 rounded-full border-2 px-5 text-sm font-semibold shadow-none transition-colors sm:flex-initial",
      isActive
        ? "border-primary bg-primary/15 text-primary"
        : "border-border bg-background text-muted-foreground hover:border-primary"
    );

  const sportLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    sportOptions.forEach((option) => {
      if (option.value !== "all") {
        map.set(option.value, option.label);
      }
    });
    return map;
  }, [sportOptions]);

  const abilityLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    abilityOptions.forEach((option) => {
      if (option.value !== "all") {
        map.set(option.value, option.label);
      }
    });
    return map;
  }, [abilityOptions]);

  const genderLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    genderOptions.forEach((option) => {
      if (option.value !== "all") {
        map.set(option.value, option.label);
      }
    });
    return map;
  }, [genderOptions]);

  const lookups = useMemo(
    () => ({
      cityMap,
      sportMap: sportLabelMap,
      abilityMap: abilityLabelMap,
      genderMap: genderLabelMap,
    }),
    [cityMap, sportLabelMap, abilityLabelMap, genderLabelMap]
  );

  const baseSpots = useMemo<Spot[]>(() => {
    if (!games.length) {
      return [];
    }
    return games
      .filter((game) => game.status === "confirmed")
      .map((game) => gameToSpot(game, lookups));
  }, [games, lookups]);

  useEffect(() => {
    let cancelled = false;

    const loadReferenceData = async () => {
      setIsReferenceLoading(true);
      try {
        const data = await fetchReferenceData();
        if (cancelled) {
          return;
        }
        if (data.cities?.length) {
          setCityOptions(toCityOptions(data.cities));
        }
        if (data.sports?.length) {
          setSportOptions(toSportOptions(data.sports));
        }
        if (data.abilities?.length) {
          setAbilityOptions(toAbilityOptions(data.abilities));
        }
        if (data.genders?.length) {
          setGenderOptions(toGenderOptions(data.genders));
        }
      } catch (error) {
        console.error("Failed to load reference data", error);
      } finally {
        if (!cancelled) {
          setIsReferenceLoading(false);
        }
      }
    };

    loadReferenceData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  useEffect(() => {
    const sportParam = searchParams.get("sport");
    const normalizedSport = sportParam ? sportParam.toUpperCase() : "all";
    setFilters((prev) => {
      if (!sportParam && prev.sport === "all") {
        return prev;
      }
      if (sportParam && prev.sport === normalizedSport) {
        return prev;
      }
      return {
        ...prev,
        sport: sportParam ? normalizedSport : "all",
      };
    });
  }, [searchParams]);

  useEffect(() => {
    if (!cityOptions.length) {
      return;
    }
    const firstValue = cityOptions[0].value;
    setDefaultCity(firstValue);
    setFilters((prev) => {
      if (prev.city && cityOptions.some((option) => option.value === prev.city)) {
        return prev;
      }
      return {
        ...prev,
        city: firstValue,
      };
    });
  }, [cityOptions]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadGames();
    setIsRefreshing(false);
  }, [loadGames]);

  const filteredSpots = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const selectedCityOption = cityMap.get(filters.city);

    return baseSpots.filter((spot) => {
      if (!filters.showFullGames && spot.slotsLeft <= 0) {
        return false;
      }

      if (filters.sport !== "all" && spot.sportCode !== filters.sport) {
        return false;
      }

      if (
        selectedCityOption &&
        spot.city.toLowerCase() !== selectedCityOption.label.toLowerCase()
      ) {
        return false;
      }

      if (filters.ability !== "all") {
        const abilityValue = filters.ability.toLowerCase();
        if (!spot.abilityLevel.toLowerCase().includes(abilityValue)) {
          return false;
        }
      }

      if (
        filters.gender !== "all" &&
        spot.gender.toLowerCase() !== filters.gender.toLowerCase()
      ) {
        return false;
      }

      const start = new Date(spot.startTime);
      const end = new Date(spot.endTime);

      if (start <= now) {
        return false;
      }

      if (filters.date === "today") {
        if (start < startOfToday || start >= endOfToday) {
          return false;
        }
      } else if (filters.date === "week") {
        if (start < startOfToday || start >= endOfWeek) {
          return false;
        }
      } else if (filters.date === "now") {
        if (now < start || now > end) {
          return false;
        }
      }

      return true;
    });
  }, [baseSpots, filters, cityMap]);

  useEffect(() => {
    if (filteredSpots.some((spot) => spot.id === selectedSpotId)) {
      return;
    }
    setSelectedSpotId(filteredSpots[0]?.id ?? null);
  }, [filteredSpots, selectedSpotId]);

  const handleSelectChange =
    <T extends keyof Filters>(key: T) =>
    (value: string) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value as Filters[T],
      }));

      if (key === "sport") {
        setSearchParams((prevParams) => {
          const next = new URLSearchParams(prevParams);
          if (value === "all") {
            next.delete("sport");
          } else {
            next.set("sport", value);
          }
          return next;
        });
      }
    };

  const handleCardSelect = (spotId: string) => {
    setSelectedSpotId(spotId);
  };

  const handleViewDetails = (spot: Spot) => {
    navigate(`/games/${spot.id}`, { state: { spot } });
  };

  const renderSkeleton = () =>
    Array.from({ length: 4 }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="flex gap-4 rounded-xl border border-border bg-card p-4"
      >
        <Skeleton className="h-28 w-28 rounded-lg" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-4 w-2/3" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    ));

  return (
    <div className="flex min-h-[120vh] flex-col bg-muted/20">
      <div className="flex flex-1 flex-col overflow-hidden pb-12 lg:flex-row">
        <div className="flex w-full flex-col bg-background lg:min-w-[360px] lg:flex-[7] lg:border-r lg:border-border">
          <div className="border-b border-border p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                    {activeCity.label}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                    Discover games that fit your vibe and skill level.
                  </h2>
                </div>
                <div className="hidden lg:flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full"
                    onClick={() => handleRefresh()}
                    disabled={isRefreshing || isGamesLoading}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {isRefreshing || isGamesLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={filters.city}
                    onValueChange={handleSelectChange("city")}
                  >
                    <SelectTrigger
                      aria-label="City filter"
                      className={getFilterTriggerClasses(cityFilterActive)}
                    >
                      <span className="pointer-events-none">Filter</span>
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.sport}
                    onValueChange={handleSelectChange("sport")}
                  >
                    <SelectTrigger
                      aria-label="Sport filter"
                      className={getFilterTriggerClasses(sportFilterActive)}
                    >
                      <span className="pointer-events-none">Sport</span>
                    </SelectTrigger>
                    <SelectContent>
                      {sportOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.ability}
                    onValueChange={handleSelectChange("ability")}
                  >
                    <SelectTrigger
                      aria-label="Ability filter"
                      className={getFilterTriggerClasses(abilityFilterActive)}
                    >
                      <span className="pointer-events-none">Ability</span>
                    </SelectTrigger>
                    <SelectContent>
                      {abilityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.gender}
                    onValueChange={handleSelectChange("gender")}
                  >
                    <SelectTrigger
                      aria-label="Gender filter"
                      className={getFilterTriggerClasses(genderFilterActive)}
                    >
                      <span className="pointer-events-none">Gender</span>
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.date}
                    onValueChange={handleSelectChange("date")}
                  >
                    <SelectTrigger
                      aria-label="Date filter"
                      className={getFilterTriggerClasses(dateFilterActive)}
                    >
                      <span className="pointer-events-none">Date</span>
                    </SelectTrigger>
                    <SelectContent>
                      {dateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {/* <div className="flex items-center gap-3 rounded-full border border-border bg-background px-4 py-1.5">
                    <Label
                      htmlFor="show-full-games"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Show full games
                    </Label>
                    <Switch
                      id="show-full-games"
                      checked={filters.showFullGames}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({
                          ...prev,
                          showFullGames: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center gap-3 rounded-full border border-border bg-background px-4 py-1.5">
                    <Label
                      htmlFor="show-leagues"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Leagues & tournaments
                    </Label>
                    <Switch
                      id="show-leagues"
                      checked={filters.showLeagues}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({
                          ...prev,
                          showLeagues: checked,
                        }))
                      }
                    />
                  </div> */}

                  <div className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
                    <div className="flex items-center gap-1">
                      <Signal className="h-3.5 w-3.5 text-primary" />
                      <span>{filteredSpots.length} games</span>
                    </div>
                    <span className="text-muted-foreground/60">·</span>
                    <span>
                      {filters.showFullGames
                        ? "Including full sessions"
                        : "Only spots with space"}
                    </span>
                  </div>

                  <div className="flex w-full items-center justify-between gap-3 lg:hidden">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Signal className="h-3.5 w-3.5 text-primary" />
                      <span>{filteredSpots.length} games</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full px-4"
                        onClick={() => setIsMapDialogOpen(true)}
                      >
                        <MapIcon className="mr-2 h-4 w-4" />
                        Full map
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="space-y-4">{renderSkeleton()}</div>
            ) : filteredSpots.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-muted p-4">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No games found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or check back later for new games.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    {
                      setFilters({
                        ...INITIAL_FILTERS,
                        city: defaultCity || cityOptions[0]?.value || "",
                      });
                      setSearchParams((prevParams) => {
                        const next = new URLSearchParams(prevParams);
                        next.delete("sport");
                        return next;
                      });
                    }
                  }
                >
                  Reset search
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {filteredSpots.map((spot) => {
                  const isActive = selectedSpotId === spot.id;
                  const capacity = spot.capacity || 0;
                  const baseSlotsLeft = spot.slotsLeft ?? 0;
                  const joinedCount =
                    spot.players?.length ?? (capacity > 0 ? Math.max(capacity - baseSlotsLeft, 0) : 0);
                  const slotsLeft =
                    capacity > 0 ? Math.max(capacity - joinedCount, 0) : Math.max(baseSlotsLeft, 0);
                  const capacityDisplay = capacity > 0 ? capacity : joinedCount;

                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onMouseEnter={() => handleCardSelect(spot.id)}
                      onFocus={() => handleCardSelect(spot.id)}
                      onClick={() => handleViewDetails(spot)}
                      className={cn(
                        "group relative flex w-full gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40",
                        isActive && "border-primary/50 shadow-lg"
                      )}
                    >
                      <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-gradient-to-br from-primary/70 via-primary to-primary/80 text-white">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#ffffff22,_transparent)]" />
                        <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
                          {spot.sportCode}
                        </span>
                        <div className="absolute bottom-3 left-3 text-xs font-semibold">
                          {spot.city.slice(0, 3).toUpperCase()}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold leading-tight">
                                {spot.title}
                              </h3>
                              {capacity > 0 && slotsLeft / capacity <= 0.3 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-semibold uppercase tracking-wide text-primary"
                                >
                                  Hot
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-primary/80" />
                              <span className="line-clamp-1">{spot.address}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                            onClick={(event) => {
                              event.stopPropagation();
                            }}
                          >
                            {/* <Heart className="h-4 w-4" /> */}
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary/80" />
                            <span>{formatDate(spot.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
                            <Signal className="h-3.5 w-3.5 text-primary/80" />
                            <span>{formatTimeRange(spot)}</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
                            <Users className="h-3.5 w-3.5 text-primary/80" />
                            <span>
                              {joinedCount}/{capacityDisplay} joined
                            </span>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
                            <MapPin className="h-3.5 w-3.5 text-primary/80" />
                            <span>{spot.city}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant={spot.isPaid ? "default" : "secondary"}>
                            {formatPrice(spot)}
                          </Badge>
                          <div className="text-right text-xs font-medium text-muted-foreground">
                            {spot.abilityLevel}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="hidden min-w-[280px] flex-[5] flex-col border-l border-border bg-muted/40 lg:flex">
          <div className="flex-1 overflow-hidden">
            <SpotMap
              spots={filteredSpots}
              selectedSpotId={selectedSpotId}
              onMarkerClick={handleCardSelect}
              defaultCenter={activeCity.center}
            />
          </div>
        </div>
      </div>

      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="h-[92vh] max-w-full overflow-hidden rounded-none border-none bg-background p-0 sm:rounded-3xl sm:border sm:p-0 md:max-w-4xl">
          {/* <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
            <DialogTitle className="text-base font-semibold text-foreground">
              Nearby games map
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setIsMapDialogOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader> */}
          <div className="h-full min-h-[70vh] w-full flex-1">
            <SpotMap
              spots={filteredSpots}
              selectedSpotId={selectedSpotId}
              onMarkerClick={(spotId) => {
                handleCardSelect(spotId);
                const targetSpot =
                  filteredSpots.find((spot) => spot.id === spotId) ||
                  baseSpots.find((spot) => spot.id === spotId);
                if (targetSpot) {
                  setIsMapDialogOpen(false);
                  navigate(`/games/${spotId}`, { state: { spot: targetSpot } });
                }
              }}
              defaultCenter={activeCity.center}
            />
          </div>
        </DialogContent>
      </Dialog>
      <AppFooter />
    </div>
  );
};

export default FindGame;
