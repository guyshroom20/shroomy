export type Availability = "available" | "away" | "offline";

export type Photo = {
  /** Real image URL. Falls back to the gradient when missing. */
  src?: string;
  /** Two colours used for the placeholder gradient. */
  tint: [string, string];
  alt: string;
};

export type Tag = { emoji: string; label: string };

export type Profile = {
  id: string;
  displayName: string;
  age: number;
  verified: boolean;
  availability: Availability;
  /** Town or area only. Never an exact address. */
  area: string;
  distanceMiles: number;
  /** Approximate map position (0 to 1 within the map viewport), pre-fuzzed server side. */
  mapPosition: { x: number; y: number };
  bio: string;
  tags: Tag[];
  photos: Photo[];
  lockedCount: number;
  story?: Story;
};

export type Story = {
  id: string;
  caption: string;
  nowPlaying?: string;
  slides: Photo[];
};

export type Message = {
  id: string;
  fromMe: boolean;
  text: string;
  sentAt: string;
  status?: "sent" | "delivered" | "read";
};

export type Conversation = {
  id: string;
  profileId: string;
  unread: number;
  messages: Message[];
};

export type FilterChip = { id: string; label: string };
