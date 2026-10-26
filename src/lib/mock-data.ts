import type { Conversation, FilterChip, Profile } from "./types";

// Placeholder data until the API exists. Photos are mood/lifestyle stock shots
// (Unsplash licence, via picsum.photos) in public/photos, standing in for
// verified advertiser uploads. The tint still shows while an image loads.

const tints: [string, string][] = [
  ["#f59e0b", "#7c2d12"],
  ["#ef4444", "#3b0764"],
  ["#60a5fa", "#1e3a8a"],
  ["#a8a29e", "#44403c"],
  ["#34d399", "#064e3b"],
  ["#f472b6", "#4c0519"],
  ["#818cf8", "#1e1b4b"],
  ["#fb923c", "#431407"],
];

const photos = (seed: number, name: string, ids: number[]) =>
  ids.map((id, i) => ({
    src: `/photos/${id}.jpg`,
    tint: tints[(seed + i) % tints.length],
    alt: `${name}, photo ${i + 1}`,
  }));

export const profiles: Profile[] = [
  {
    id: "helen",
    displayName: "Helen",
    age: 23,
    verified: true,
    availability: "available",
    area: "Shoreditch, London",
    distanceMiles: 1.2,
    mapPosition: { x: 0.55, y: 0.42 },
    bio: "Hey there! I'm Helen, a mix of good vibes, a curious mind and a love for deep conversations and spontaneous laughs. I enjoy meaningful connections, fun chats and people who know how to make the most of an evening.",
    tags: [
      { emoji: "🐕", label: "Has a dog" },
      { emoji: "🏋️", label: "Gym rat" },
      { emoji: "🎬", label: "Movie buff" },
      { emoji: "🏎️", label: "Motorsport" },
      { emoji: "🧘", label: "Wellness" },
      { emoji: "💬", label: "Talks" },
    ],
    photos: photos(0, "Helen", [249, 237, 274, 1078, 195]),
    lockedCount: 12,
    story: {
      id: "s-helen",
      caption: "It's you that I adore, as we drift into the night",
      nowPlaying: "Cigarettes After Sex – Sunsetz",
      slides: photos(0, "Helen", [195, 223, 171, 56, 1026]),
    },
  },
  {
    id: "viktoria",
    displayName: "Viktoria",
    age: 24,
    verified: true,
    availability: "available",
    area: "Camden, London",
    distanceMiles: 2.4,
    mapPosition: { x: 0.25, y: 0.22 },
    bio: "Art school dropout, full-time night owl. Ask me about vinyl.",
    tags: [
      { emoji: "🎨", label: "Art" },
      { emoji: "🎧", label: "Vinyl" },
      { emoji: "🍷", label: "Wine" },
    ],
    photos: photos(1, "Viktoria", [39, 75, 1059, 257, 173]),
    lockedCount: 4,
    story: {
      id: "s-viktoria",
      caption: "Golden hour, every hour",
      slides: photos(1, "Viktoria", [173, 206, 110]),
    },
  },
  {
    id: "angel",
    displayName: "Angel",
    age: 22,
    verified: true,
    availability: "away",
    area: "Islington, London",
    distanceMiles: 3.1,
    mapPosition: { x: 0.68, y: 0.16 },
    bio: "Soft spoken, loud laugh. Weekends by the sea.",
    tags: [
      { emoji: "🌊", label: "Beach" },
      { emoji: "📚", label: "Reader" },
    ],
    photos: photos(2, "Angel", [13, 24, 1015, 199]),
    lockedCount: 0,
  },
  {
    id: "eliza",
    displayName: "Eliza",
    age: 26,
    verified: true,
    availability: "offline",
    area: "Hackney, London",
    distanceMiles: 2.9,
    mapPosition: { x: 0.2, y: 0.55 },
    bio: "Fashion, film photography and far too much coffee.",
    tags: [
      { emoji: "📷", label: "Film photos" },
      { emoji: "☕", label: "Coffee" },
    ],
    photos: photos(3, "Eliza", [250, 63, 21, 42, 1067]),
    lockedCount: 8,
  },
  {
    id: "carmen",
    displayName: "Carmen",
    age: 25,
    verified: false,
    availability: "available",
    area: "Bethnal Green, London",
    distanceMiles: 1.8,
    mapPosition: { x: 0.8, y: 0.66 },
    bio: "Dancer. Traveller. Always planning the next trip.",
    tags: [
      { emoji: "💃", label: "Dancer" },
      { emoji: "✈️", label: "Travel" },
    ],
    photos: photos(4, "Carmen", [49, 183, 158, 174]),
    lockedCount: 2,
  },
  {
    id: "valentyna",
    displayName: "Valentyna",
    age: 27,
    verified: true,
    availability: "available",
    area: "Angel, London",
    distanceMiles: 3.6,
    mapPosition: { x: 0.24, y: 0.78 },
    bio: "Calm energy, sharp humour.",
    tags: [{ emoji: "🎻", label: "Music" }],
    photos: photos(5, "Valentyna", [145, 1082, 306, 166]),
    lockedCount: 0,
  },
  {
    id: "evelin",
    displayName: "Evelin",
    age: 29,
    verified: true,
    availability: "away",
    area: "Clerkenwell, London",
    distanceMiles: 4.2,
    mapPosition: { x: 0.92, y: 0.36 },
    bio: "Gallery days, jazz bar nights.",
    tags: [{ emoji: "🎷", label: "Jazz" }],
    photos: photos(6, "Evelin", [122, 1076, 1081, 192]),
    lockedCount: 6,
  },
];

export const getProfile = (id: string) => profiles.find((p) => p.id === id);

export const exploreFilters: FilterChip[] = [
  { id: "age", label: "18–24" },
  { id: "verified", label: "ID verified" },
  { id: "available", label: "Available now" },
  { id: "london", label: "London" },
];

export const conversations: Conversation[] = [
  {
    id: "c-helen",
    profileId: "helen",
    unread: 2,
    messages: [
      { id: "m1", fromMe: true, text: "Hi Helen, loved your story earlier 🎶", sentAt: "2026-10-26T18:02:00Z", status: "read" },
      { id: "m2", fromMe: false, text: "Haha thank you! That song is on repeat", sentAt: "2026-10-26T18:04:00Z" },
      { id: "m3", fromMe: true, text: "Are you free later this week?", sentAt: "2026-10-26T18:05:00Z", status: "read" },
      { id: "m4", fromMe: false, text: "I should be! Thursday evening works", sentAt: "2026-10-26T18:21:00Z" },
      { id: "m5", fromMe: false, text: "Check my availability on my profile ✨", sentAt: "2026-10-26T18:21:30Z" },
    ],
  },
  {
    id: "c-viktoria",
    profileId: "viktoria",
    unread: 0,
    messages: [
      { id: "m1", fromMe: false, text: "Thanks for the message 🙂", sentAt: "2026-10-26T15:10:00Z" },
      { id: "m2", fromMe: true, text: "Any time! What are you listening to?", sentAt: "2026-10-26T15:12:00Z", status: "delivered" },
    ],
  },
  {
    id: "c-carmen",
    profileId: "carmen",
    unread: 1,
    messages: [
      { id: "m1", fromMe: false, text: "Back in London from Friday!", sentAt: "2026-10-25T21:40:00Z" },
    ],
  },
  {
    id: "c-eliza",
    profileId: "eliza",
    unread: 0,
    messages: [
      { id: "m1", fromMe: true, text: "Your film shots are amazing", sentAt: "2026-10-24T11:00:00Z", status: "read" },
      { id: "m2", fromMe: false, text: "Aw, Portra 400 does the heavy lifting", sentAt: "2026-10-24T11:30:00Z" },
    ],
  },
];

export const getConversation = (id: string) => conversations.find((c) => c.id === id);
