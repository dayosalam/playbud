export interface SpotPlayer {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface Spot {
  id: string;
  sportCode: string;
  title: string;
  description: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  capacity: number;
  slotsLeft: number;
  isPaid: boolean;
  priceCents?: number;
  currency?: string;
  hostName: string;
  hostHandle: string;
  skillLevel: string;
  gender: string;
  abilityLevel: string;
  coverImage: string;
  gallery?: string[];
  descriptionPoints: string[];
  extraNotes: string[];
  rules: string[];
  locationNotes: string[];
  cancellationPolicy: string;
  players: SpotPlayer[];
}

export const spotsData: Spot[] = [
  {
    id: "spot-rackethub-28oct",
    sportCode: "BADMINTON",
    title: "RacketHub Tuesday",
    description: "Competitive badminton doubles evening with friendly hosts.",
    address: "WBA Community Sports Hall, Halfords Ln, Birmingham",
    city: "Birmingham",
    lat: 52.5062,
    lng: -1.9634,
    startTime: "2025-10-28T20:30:00.000Z",
    endTime: "2025-10-28T22:30:00.000Z",
    durationMinutes: 120,
    capacity: 18,
    slotsLeft: 4,
    isPaid: true,
    priceCents: 1500,
    currency: "GBP",
    hostName: "Yuan Lu",
    hostHandle: "@yuanlu-badminton",
    skillLevel: "Mixed",
    gender: "Mixed",
    abilityLevel: "Intermediate & Advanced",
    coverImage: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
    ],
    descriptionPoints: [
      "Fast-paced badminton doubles sessions with rotating partners.",
      "All equipment provided, just bring indoor trainers and energy.",
      "Skill drills for the first 20 minutes, followed by match play.",
      "Post-game social with refreshments in the lounge.",
    ],
    extraNotes: [
      "Changing rooms & showers available on-site.",
      "Free parking after 6pm.",
      "WhatsApp group invite shared after your first session.",
    ],
    rules: [
      "Arrive 10 minutes early for warm-up.",
      "No black-soled shoes on the courts.",
      "Respect rotation, everyone gets equal time.",
      "Cancel at least 12 hours before if you can't make it.",
    ],
    locationNotes: [
      "Enter via the main reception, courts are on Level 1.",
      "5 minute walk from The Hawthorns station.",
    ],
    cancellationPolicy:
      "This game has a 12 hour cancellation window. Cancel in time for a full refund minus transaction fees.",
    players: [
      { id: "p1", name: "Yuan", initials: "YU" },
      { id: "p2", name: "Herbert", initials: "HE" },
      { id: "p3", name: "Korku", initials: "KO" },
      { id: "p4", name: "Em", initials: "EM" },
      { id: "p5", name: "Brian", initials: "BR" },
      { id: "p6", name: "William", initials: "WI" },
      { id: "p7", name: "Oliver", initials: "OL" },
      { id: "p8", name: "Yuping", initials: "YU" },
    ],
  },
  {
    id: "spot-volleyball-08nov",
    sportCode: "VOLLEYBALL",
    title: "Birmingham Mixed Volleyball Session",
    description: "Mixed level indoor volleyball scrimmage for all abilities.",
    address: "Prince Albert High School, Holford Drive, Birmingham",
    city: "Birmingham",
    lat: 52.5215,
    lng: -1.9154,
    startTime: "2025-11-08T14:00:00.000Z",
    endTime: "2025-11-08T16:00:00.000Z",
    durationMinutes: 120,
    capacity: 24,
    slotsLeft: 6,
    isPaid: true,
    priceCents: 1600,
    currency: "GBP",
    hostName: "Sofia Martins",
    hostHandle: "@sofisets",
    skillLevel: "All Levels",
    gender: "Mixed",
    abilityLevel: "Beginner Friendly",
    coverImage: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
    ],
    descriptionPoints: [
      "Social indoor volleyball with friendly scrimmages.",
      "Warm-up drills followed by coached rotations.",
      "Teams rebalanced every 20 minutes to keep games competitive.",
    ],
    extraNotes: [
      "Changing rooms & lockers available (bring a £1 coin).",
      "Post-game food at the local cafe – everyone welcome.",
    ],
    rules: [
      "Fair play and positive vibes only.",
      "No outdoor shoes on the court.",
      "Respect the rotation and coach instructions.",
    ],
    locationNotes: [
      " Free parking in the school car park.",
      "Bus 997 stops right outside the venue.",
    ],
    cancellationPolicy:
      "Cancel up to 6 hours before the session for a credit towards future games.",
    players: [
      { id: "v1", name: "Sofia", initials: "SO" },
      { id: "v2", name: "Emma", initials: "EM" },
      { id: "v3", name: "Raj", initials: "RA" },
      { id: "v4", name: "Alex", initials: "AL" },
      { id: "v5", name: "Tosin", initials: "TO" },
      { id: "v6", name: "Sam", initials: "SA" },
    ],
  },
  {
    id: "spot-dropshotters-07nov",
    sportCode: "BADMINTON",
    title: "Drop Shotters Friday Evening Badminton",
    description: "Club night focused on fast rallies and friendly competition.",
    address: "Hadley Stadium, Wilson Rd, Smethwick, Birmingham",
    city: "Birmingham",
    lat: 52.4981,
    lng: -1.9724,
    startTime: "2025-11-07T20:00:00.000Z",
    endTime: "2025-11-07T22:00:00.000Z",
    durationMinutes: 120,
    capacity: 20,
    slotsLeft: 5,
    isPaid: true,
    priceCents: 1800,
    currency: "GBP",
    hostName: "Drop Shotters Club",
    hostHandle: "@dropshotters",
    skillLevel: "Advanced",
    gender: "Mixed",
    abilityLevel: "Competitive",
    coverImage: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
    ],
    descriptionPoints: [
      "Premier club night welcoming experienced players.",
      "League style format with ladders and rankings.",
      "Shuttles and scoreboards provided.",
    ],
    extraNotes: [
      "Optional debrief over drinks at the clubhouse afterwards.",
      "Bring your own racket; demo rackets available on request.",
    ],
    rules: [
      "Matches to 21 rally scoring, best of 3.",
      "Report scores to the host at the end of each game.",
      "Respect equipment and venue guidelines.",
    ],
    locationNotes: [
      "Venue located inside Hadley Stadium – follow signs to Court B.",
    ],
    cancellationPolicy:
      "Full refund if cancelled 24 hours in advance. Later cancellations will incur the full fee.",
    players: [
      { id: "d1", name: "Lu", initials: "LU" },
      { id: "d2", name: "Aaron", initials: "AA" },
      { id: "d3", name: "Rav", initials: "RA" },
      { id: "d4", name: "Hana", initials: "HA" },
      { id: "d5", name: "Jules", initials: "JU" },
    ],
  },
];
