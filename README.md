# injoradev.in

Cinematic portfolio for **Injora** — Full-Stack Developer · Open-Source Contributor.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · React Three Fiber / Three.js · Motion · Lenis

## Architecture

| Path | What |
| --- | --- |
| `src/content/profile.ts` | **All copy and data.** Every entry is traced to the GitHub profile README, a repo, or a PR. |
| `src/content/contributions.ts` | Contribution calendar snapshot — generated, never hand-edited. |
| `src/components/scene/` | The WebGL layer: procedural blade (`bladeGeometry.ts`), particle tunnel, scroll keyframes. Lazy-loaded chunk. |
| `src/components/sections/` | Page sections (Hero → About → Stack → Work → Open Source → Journey → Contact). |
| `src/components/mockups/` | Animated "interface studies" for each flagship project (pause when offscreen). |
| `src/lib/store.ts` | Mutable store shared by the DOM and the render loop — no React re-renders per frame. |

**How the 3D follows the page:** each section carries `data-scene`. `Runtime.tsx` turns scroll position into a continuous
section index; `scene/keyframes.ts` defines the blade's pose/energy per section (sealed → activated → intensified → calm)
and the scene blends between them.

**Performance:** Three.js ships in its own chunk after hydration; DPR is capped and drops automatically if frame time
suffers; mobile gets ~70% fewer particles; no WebGL / Save-Data / very low-end devices get a static SVG fallback;
`prefers-reduced-motion` disables smooth scroll and renders the scene on demand.

## Keeping it truthful

```bash
scripts/snapshot-contributions.sh   # refresh calendar + counts from the GitHub API
```

Then update `ossStats` and PR states (`merged` / `open`) in `profile.ts`. Don't add anything that can't be linked to a source.

## Easter eggs

Hidden. Check the console.
