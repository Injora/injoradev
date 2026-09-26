/**
 * Content model for the portfolio.
 *
 * Source of truth: https://github.com/Injora/Injora (profile README), the linked
 * repositories, and the public GitHub API (PR states verified 2026-09-26).
 * Nothing here should be added unless it can be traced to one of those sources.
 */

export const identity = {
  name: "Injora",
  role: "Full-Stack Developer",
  secondary: "Open-Source Contributor",
  division: "Full-Stack Division",
  tagline: "Building full-stack systems — and sharpening them in open source.",
  mission: "Mastering Java + Spring Boot",
  next: "AI / ML",
  offDuty: ["anime", "movies", "comics"],
  quote: "The code is my zanpakutō, and every commit sharpens the blade.",
  site: "https://injoradev.in",
  github: "https://github.com/Injora",
  githubHandle: "Injora",
  linkedin: "https://www.linkedin.com/in/injora-injora-4b1554346/",
  email: "injoraman@gmail.com",
} as const;

export type SectionId = "top" | "about" | "stack" | "work" | "open-source" | "journey" | "contact";

export const navItems: { id: SectionId; label: string }[] = [
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "open-source", label: "Open Source" },
  { id: "contact", label: "Contact" },
];

/* ───────────────────────────── Stack ───────────────────────────── */

export type TechGroupId = "shikai" | "bankai" | "kido" | "tools" | "training";

export const techGroups: { id: TechGroupId; label: string; codename: string; blurb: string }[] = [
  { id: "shikai", label: "Frontend", codename: "Shikai", blurb: "The first release — interfaces people touch." },
  { id: "bankai", label: "Backend", codename: "Bankai", blurb: "Full release — APIs, auth, realtime, and the rules that hold them together." },
  { id: "kido", label: "Databases", codename: "Kidō", blurb: "Supporting arts — schemas, row-level security, geospatial queries." },
  { id: "tools", label: "Tools", codename: "Gear", blurb: "What ships the work and connects it to the world." },
  { id: "training", label: "Learning / Exploring", codename: "Training arc", blurb: "Where the blade is being sharpened right now." },
];

export type Tech = {
  name: string;
  group: TechGroupId;
  /** what it is to me, in one line */
  note: string;
  /** where it's actually used — must reference real repos / PRs */
  usedIn: string[];
  /** 0–1, how central it is — drives node size in the constellation */
  weight: number;
  /** marks the README's declared zanpakutō */
  signature?: boolean;
};

export const techs: Tech[] = [
  { name: "JavaScript", group: "shikai", signature: true, weight: 1, note: "My zanpakutō — the main language everything else grew from.", usedIn: ["Bleach Battle Arena", "Spin-n-Spill", "HealthQuest", "Sugar Labs Music Blocks PR"] },
  { name: "TypeScript", group: "shikai", weight: 0.95, note: "Default for anything with more than one moving part.", usedIn: ["OpenSource Compass", "NST-Events", "Shuttle Tracker", "cBioPortal frontend PRs"] },
  { name: "React", group: "shikai", weight: 0.9, note: "Component systems and dashboards.", usedIn: ["HealthQuest dashboard", "cBioPortal frontend PRs"] },
  { name: "Next.js", group: "shikai", weight: 0.75, note: "App Router builds with server-side session handling.", usedIn: ["Nirmaan 3.0 registration", "This portfolio"] },
  { name: "React Native", group: "shikai", weight: 0.6, note: "One Expo codebase for student, driver and admin apps.", usedIn: ["Shuttle Tracker"] },
  { name: "HTML / CSS", group: "shikai", weight: 0.7, note: "Hand-built layouts, keyframes and motion without a framework.", usedIn: ["Bleach Battle Arena", "CSS Art Museum contribution"] },
  { name: "Tailwind", group: "shikai", weight: 0.5, note: "Utility-first styling when speed matters.", usedIn: ["Nirmaan 3.0 registration"] },

  { name: "Node.js", group: "bankai", weight: 0.9, note: "Servers, CLIs and realtime game loops.", usedIn: ["Spin-n-Spill", "NST-Events"] },
  { name: "Express", group: "bankai", weight: 0.85, note: "API layer that owns OAuth, JWT rotation and RBAC.", usedIn: ["NST-Events", "Spin-n-Spill"] },
  { name: "Supabase", group: "bankai", weight: 0.75, note: "Auth, Realtime, Edge Functions and RPCs.", usedIn: ["Shuttle Tracker", "Nirmaan 3.0 registration", "HealthQuest"] },
  { name: "Socket.io", group: "bankai", weight: 0.5, note: "Room-based realtime sync across devices.", usedIn: ["Spin-n-Spill"] },
  { name: "Prisma", group: "bankai", weight: 0.55, note: "Typed data access with a cached research model.", usedIn: ["OpenSource Compass"] },
  { name: "Python / Django", group: "bankai", weight: 0.45, note: "Listed in my arsenal for backend work.", usedIn: ["Profile arsenal"] },

  { name: "PostgreSQL", group: "kido", weight: 0.9, note: "Row-Level Security as a second line of defense.", usedIn: ["NST-Events", "Nirmaan 3.0 registration", "OpenSource Compass"] },
  { name: "PostGIS", group: "kido", weight: 0.6, note: "Geofenced pickups and location-verified attendance.", usedIn: ["Shuttle Tracker", "NST-Events"] },
  { name: "MySQL", group: "kido", weight: 0.4, note: "Relational work outside Postgres.", usedIn: ["Profile arsenal"] },
  { name: "MongoDB", group: "kido", weight: 0.45, note: "Document storage for flexible data.", usedIn: ["Profile arsenal"] },

  { name: "Git / GitHub", group: "tools", weight: 0.85, note: "22 merged PRs into repositories I don't own.", usedIn: ["cBioPortal", "Sugar Labs", "NST-SDC"] },
  { name: "GitHub API", group: "tools", weight: 0.5, note: "Live org research: activity, docs, good-first-issues.", usedIn: ["OpenSource Compass"] },
  { name: "Vercel", group: "tools", weight: 0.5, note: "Deploys for web builds.", usedIn: ["HealthQuest", "Profile arsenal"] },
  { name: "n8n", group: "tools", weight: 0.4, note: "Workflow automation from sheet entry to database.", usedIn: ["HealthQuest"] },

  { name: "Java", group: "training", weight: 0.7, note: "Current mission — and already in production code.", usedIn: ["cBioPortal backend PR #12333 (merged)"] },
  { name: "Spring Boot", group: "training", weight: 0.6, note: "Learning it by fixing real Spring code paths.", usedIn: ["cBioPortal backend"] },
  { name: "LLM APIs", group: "training", weight: 0.55, note: "AI features constrained by evidence, not vibes.", usedIn: ["HealthQuest (Groq)", "OpenSource Compass summarizer"] },
];

/* ───────────────────────────── Projects ───────────────────────────── */

export type ProjectVisual = "compass" | "events" | "shuttle" | "arena";

export type Project = {
  slug: string;
  name: string;
  codename: string;
  oneLiner: string;
  summary: string;
  highlights: string[];
  stack: string[];
  code: string;
  live?: string;
  visual: ProjectVisual;
  /** accent for the per-project environment */
  accent: string;
  year: string;
};

export const flagshipProjects: Project[] = [
  {
    slug: "opensource-compass",
    name: "OpenSource Compass",
    codename: "RecomOS",
    oneLiner: "Evidence-backed open-source org matching for beginners.",
    summary:
      "Describe yourself — languages, interests, skill level, time — and it researches real GSoC organizations, then returns a ranked top 5 with a personalized 30-day roadmap.",
    highlights: [
      "Every claim is an observed fact with a source link, or explicitly labeled “Unknown / insufficient data.”",
      "Pipeline: candidate discovery → per-org research (GitHub API, docs, community) → weighted scoring → narrative.",
      "The LLM only rephrases scored reasons — it never adds claims.",
    ],
    stack: ["TypeScript", "Prisma", "PostgreSQL", "GitHub API"],
    code: "https://github.com/Injora/RecomOS",
    live: "https://recomos.onrender.com/",
    visual: "compass",
    accent: "#7fb2ff",
    year: "2026",
  },
  {
    slug: "nst-events",
    name: "NST-Events",
    codename: "Campus OS",
    oneLiner: "A campus event platform designed for 3000+ students.",
    summary:
      "Discovery, team registration with waitlists, leaderboards and attendance that’s actually trustworthy — for a multi-club campus.",
    highlights: [
      "Rotating TOTP QR codes (15s) + PostGIS geofence to defeat proxy attendance.",
      "Two-tier RBAC: global roles and per-club roles, enforced by Express and Postgres RLS.",
      "Google OAuth restricted to institutional domains; 15-min JWT + rotating refresh tokens.",
    ],
    stack: ["TypeScript", "Express", "PostgreSQL", "OAuth"],
    code: "https://github.com/Injora/nst--events",
    visual: "events",
    accent: "#4da3ff",
    year: "2026",
  },
  {
    slug: "shuttle-tracker",
    name: "Shuttle Tracker",
    codename: "Senkaimon",
    oneLiner: "Live shuttle tracking for an off-campus hostel network.",
    summary:
      "Student, driver and admin roles in a single Expo codebase — with every business rule enforced server-side.",
    highlights: [
      "Pickup requests are geofence-checked with PostGIS st_distance inside an RPC.",
      "Quorum-triggered dispatch: an atomic RPC flips the first 10 pending requests.",
      "Realtime GPS streaming with dead-zone detection via scheduled RPCs.",
    ],
    stack: ["React Native", "Expo", "Supabase", "PostGIS"],
    code: "https://github.com/Injora/shuttle-tracker",
    visual: "shuttle",
    accent: "#5fd0e6",
    year: "2026",
  },
  {
    slug: "bleach-battle-arena",
    name: "Bleach Battle Arena",
    codename: "Seireitei",
    oneLiner: "A 2-player drafting and battle simulator on a live API.",
    summary:
      "Draft teams of three, clash on spiritual pressure, and trigger one-time Bankai / Resurrección revivals — all in vanilla JavaScript.",
    highlights: [
      "Continuous survivor combat: winners carry the remaining BP into the next fight.",
      "Race-based damage multipliers and one-time revival mechanics.",
      "Screen shakes, attack dashes and floating damage via pure DOM animation.",
    ],
    stack: ["JavaScript", "HTML", "CSS", "REST API"],
    code: "https://github.com/Injora/Seireitei",
    live: "https://seireitei.injoradev.in/",
    visual: "arena",
    accent: "#e21d35",
    year: "2026",
  },
];

export type SmallProject = {
  name: string;
  description: string;
  stack: string[];
  code: string;
  live?: string;
  note?: string;
};

export const moreProjects: SmallProject[] = [
  {
    name: "HealthQuest",
    description: "AI-powered, gamified health tracking — Groq-generated insights, daily tasks and an EXP system.",
    stack: ["React", "Supabase", "n8n", "Groq"],
    code: "https://github.com/Injora/HealthQuest",
    live: "https://health-quest-silk.vercel.app",
  },
  {
    name: "Spin-n-Spill",
    description: "Real-time multiplayer Truth or Dare. Share a room code and play from any browser.",
    stack: ["Node.js", "Express", "Socket.io"],
    code: "https://github.com/Injora/Spin-n-Spill",
    live: "https://spin-n-spill.onrender.com/",
  },
];

export const communityProjects: SmallProject[] = [
  {
    name: "Nirmaan 3.0 Registration",
    description: "Registration site for NST-SDC’s solo hackathon — domain-restricted Google sign-in, one registration per account enforced in Postgres.",
    stack: ["Next.js 16", "Supabase", "RLS"],
    code: "https://github.com/Injora/nirman3.0",
    note: "Built for NST-SDC",
  },
  {
    name: "Newton School Clone",
    description: "Team build — contributed the arena page, leaderboard and calendar pages.",
    stack: ["JavaScript", "CSS"],
    code: "https://github.com/sohamdhande/NewtonSchool_Clone/pulls?q=is%3Apr+author%3AInjora",
    live: "https://newton-school-clone.vercel.app",
    note: "6 merged PRs",
  },
  {
    name: "Iris",
    description: "NST Student Developer Club project — footer links and logo navigation.",
    stack: ["Frontend"],
    code: "https://github.com/nst-sdc/iris/pulls?q=is%3Apr+author%3AInjora",
    live: "https://iris-frontend-smoky.vercel.app",
    note: "2 merged PRs",
  },
  {
    name: "Fate of Three",
    description: "Team game build — added the animations and audio layer.",
    stack: ["HTML", "JavaScript"],
    code: "https://github.com/kartikktripathi/FateofThree/pulls?q=is%3Apr+author%3AInjora",
    note: "2 merged PRs",
  },
];

/* ───────────────────────────── Open source ───────────────────────────── */

export type PRState = "merged" | "open";

export type Contribution = {
  title: string;
  repo: string;
  number: number;
  url: string;
  state: PRState;
  date: string; // yyyy-mm (merged date for merged, opened date for open)
  detail?: string;
  diff?: string;
};

export type OssOrg = {
  id: string;
  name: string;
  kind: string;
  description: string;
  url: string;
  contributions: Contribution[];
};

export const ossOrgs: OssOrg[] = [
  {
    id: "cbioportal",
    name: "cBioPortal",
    kind: "Cancer genomics platform",
    description: "Open-source platform for exploring multidimensional cancer genomics data. Contributions to both the Java/Spring backend and the React frontend.",
    url: "https://github.com/cBioPortal",
    contributions: [
      {
        title: "fix(studyview): drop generic assay filters with null values",
        repo: "cBioPortal/cbioportal",
        number: 12333,
        url: "https://github.com/cBioPortal/cbioportal/pull/12333",
        state: "merged",
        date: "2026-09",
        detail: "Prevented a 500 in the ClickHouse SQL mapper by filtering null/empty generic-assay filters in StudyViewFilterFactory — with a new JUnit test.",
        diff: "+216 −2 · 3 files",
      },
      {
        title: "Switch Twitter icon to X logo in What’s New section",
        repo: "cBioPortal/cbioportal-frontend",
        number: 5344,
        url: "https://github.com/cBioPortal/cbioportal-frontend/pull/5344",
        state: "merged",
        date: "2026-01",
        diff: "+5 −5 · 1 file",
      },
      {
        title: "fix(studyview): drop clinical data filters with null or empty values",
        repo: "cBioPortal/cbioportal",
        number: 12357,
        url: "https://github.com/cBioPortal/cbioportal/pull/12357",
        state: "open",
        date: "2026-09",
        detail: "Null values caused an NPE → opaque 500; empty lists caused a misleading 404. Brings clinical filters in line with genomic and generic-assay handling.",
        diff: "+115 −1 · 4 files",
      },
      {
        title: "feat: implement fuzzy string search for comparison groups",
        repo: "cBioPortal/cbioportal-frontend",
        number: 5448,
        url: "https://github.com/cBioPortal/cbioportal-frontend/pull/5448",
        state: "open",
        date: "2026-03",
        detail: "Resolves an existing TODO: a reusable fuzzy matcher + ranking score replaces strict regex filtering, with 12 unit tests.",
        diff: "+109 −11 · 5 files",
      },
    ],
  },
  {
    id: "sugarlabs",
    name: "Sugar Labs",
    kind: "Education software",
    description: "Open-source learning software. Fixed navigation in Music Blocks’ help widget.",
    url: "https://github.com/sugarlabs",
    contributions: [
      {
        title: "Blocked right arrow button on last page",
        repo: "sugarlabs/musicblocks",
        number: 5259,
        url: "https://github.com/sugarlabs/musicblocks/pull/5259",
        state: "merged",
        date: "2026-01",
        detail: "Disabled forward navigation on the last help page of Music Blocks.",
        diff: "+20 −19 · 1 file",
      },
    ],
  },
  {
    id: "docusaurus",
    name: "Docusaurus",
    kind: "Docs framework",
    description: "Meta’s static documentation site generator.",
    url: "https://github.com/facebook/docusaurus",
    contributions: [
      {
        title: "break(gtag): forbid deprecated anonymizeIP option",
        repo: "facebook/docusaurus",
        number: 11878,
        url: "https://github.com/facebook/docusaurus/pull/11878",
        state: "open",
        date: "2026-04",
        detail: "GA4 never stores IPs, so the option is a no-op — types removed, Joi schema forbids it with a clear error, tests updated.",
        diff: "+17 −26 · 4 files",
      },
    ],
  },
  {
    id: "nst-sdc",
    name: "NST-SDC",
    kind: "Student developer club",
    description: "NST Student Developer Club repositories.",
    url: "https://github.com/nst-sdc",
    contributions: [
      { title: "Made logo redirect to homepage", repo: "nst-sdc/iris", number: 12, url: "https://github.com/nst-sdc/iris/pull/12", state: "merged", date: "2025-11" },
      { title: "Added footer links", repo: "nst-sdc/iris", number: 11, url: "https://github.com/nst-sdc/iris/pull/11", state: "merged", date: "2025-11" },
      { title: "Go learning assignment", repo: "nst-sdc/golang-learning", number: 3, url: "https://github.com/nst-sdc/golang-learning/pull/3", state: "merged", date: "2025-11" },
    ],
  },
  {
    id: "first-contributions",
    name: "Community repos",
    kind: "First contributions · Oct 2025",
    description: "Where it started: eight merged PRs across community projects in the first weekend of October 2025.",
    url: "https://github.com/pulls?q=is%3Apr+author%3AInjora+is%3Amerged+created%3A2025-10-01..2025-10-31",
    contributions: [
      { title: "Added CSS artwork: Injora-Glowing_Dusk", repo: "pixel-museum/css-art-museum", number: 126, url: "https://github.com/pixel-museum/css-art-museum/pull/126", state: "merged", date: "2025-10" },
      { title: "Added load animation", repo: "Jay-1409/progressBoard-Frontend", number: 9, url: "https://github.com/Jay-1409/progressBoard-Frontend/pull/9", state: "merged", date: "2025-10" },
      { title: "Fixed CSS and added JS feature", repo: "mangosain/login-signup", number: 3, url: "https://github.com/mangosain/login-signup/pull/3", state: "merged", date: "2025-10" },
      { title: "WhatsApp hover effect", repo: "avinash201199/weather-app", number: 341, url: "https://github.com/avinash201199/weather-app/pull/341", state: "merged", date: "2025-10" },
      { title: "Added quiz app", repo: "roseewood/Web-Dev-Mini-Projects", number: 19, url: "https://github.com/roseewood/Web-Dev-Mini-Projects/pull/19", state: "merged", date: "2025-10" },
      { title: "Add Injora to contributors", repo: "OSSPhilippines/first-contribution", number: 25, url: "https://github.com/OSSPhilippines/first-contribution/pull/25", state: "merged", date: "2025-10" },
      { title: "Add login/signup template", repo: "avinash201199/Login-Signup-templates", number: 45, url: "https://github.com/avinash201199/Login-Signup-templates/pull/45", state: "merged", date: "2025-10" },
      { title: "Hacky-fest contribution", repo: "mice-men/hacky-fest", number: 2, url: "https://github.com/mice-men/hacky-fest/pull/2", state: "merged", date: "2025-10" },
    ],
  },
];

/** Verified via GitHub search API on 2026-09-26: `author:Injora type:pr is:merged -user:Injora` */
export const ossStats = {
  mergedExternal: 22,
  asOf: "26 Sep 2026",
};

/* ───────────────────────────── Journey ───────────────────────────── */

export type Milestone = {
  date: string;
  stage: "Learning" | "Building" | "Open Source" | "Systems" | "AI / ML";
  title: string;
  body: string;
  href?: string;
};

export const journey: Milestone[] = [
  { date: "Jun 2025", stage: "Learning", title: "The blade is forged", body: "GitHub account created. HTML, CSS and JavaScript become the first forms." },
  { date: "Oct 2025", stage: "Open Source", title: "First contributions", body: "Eight merged pull requests across community projects in a single weekend.", href: "https://github.com/pixel-museum/css-art-museum/pull/126" },
  { date: "Nov 2025", stage: "Open Source", title: "NST-SDC", body: "Merged work in the NST Student Developer Club’s Iris project.", href: "https://github.com/nst-sdc/iris/pull/11" },
  { date: "Jan 2026", stage: "Open Source", title: "Established orgs", body: "First merges into Sugar Labs’ Music Blocks and cBioPortal’s frontend.", href: "https://github.com/sugarlabs/musicblocks/pull/5259" },
  { date: "Mar 2026", stage: "Building", title: "Bleach Battle Arena ships", body: "A full drafting + battle engine in vanilla JS, live on its own subdomain.", href: "https://seireitei.injoradev.in/" },
  { date: "Apr 2026", stage: "AI / ML", title: "First AI build", body: "HealthQuest wires n8n, Groq and Supabase into a gamified health tracker.", href: "https://github.com/Injora/HealthQuest" },
  { date: "May 2026", stage: "Building", title: "Realtime", body: "Spin-n-Spill: room-based multiplayer over Socket.io.", href: "https://github.com/Injora/Spin-n-Spill" },
  { date: "Aug–Sep 2026", stage: "Systems", title: "Systems era", body: "Shuttle Tracker, NST-Events and OpenSource Compass — RLS, PostGIS, RBAC and evidence pipelines.", href: "https://github.com/Injora/nst--events" },
  { date: "Sep 2026", stage: "Open Source", title: "Java in production", body: "A Spring backend fix merged into cBioPortal — the training arc pays off.", href: "https://github.com/cBioPortal/cbioportal/pull/12333" },
  { date: "Next", stage: "AI / ML", title: "Expanding toward AI / ML", body: "Taking the full-stack foundation into machine learning systems." },
];
