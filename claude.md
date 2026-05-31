# antwerp-unseen

## what this project is
A physical street installation in Antwerp paired with a web platform.
The installation captures passersby via motion sensor, renders their
silhouette in motion blur on a public screen, and invites them to
contribute something (text, voice, photo, video) via QR code.
Contributions are moderated and displayed back on the screen and
archived on the web platform.

## the page we are currently building
The interactive archive — the web platform's explore/browse surface.
A 3D isometric photo timeline built with React Three Fiber where
contributions are visualised as stacked card clusters along a
diagonal rail, grouped by moment in time.

## surfaces (full system, not all built yet)
- physical installation screen (out of scope for this repo)
- contribution form (mobile web, QR entry point, to be built)
- interactive archive (currently in progress)
- admin / moderation panel (to be built)

## tech stack
- Vite + React + TypeScript
- React Three Fiber (@react-three/fiber)
- React Three Drei (@react-three/drei)
- React Router DOM

## project structure
src/
├── components/
│   ├── Scene/          # R3F Canvas, camera, lighting, OrbitControls
│   ├── TimeCluster/    # group of Card meshes at a point in time
│   └── Card/           # individual photo mesh with texture (Billboard)
├── routes/
│   ├── home.tsx        # landing page
│   └── explore.tsx     # main 3D archive view
├── data/
│   └── mock.ts         # mock cluster/photo data
├── types/
│   └── index.ts        # Photo, Cluster, Tag interfaces
└── styles/
    └── tokens.css      # global CSS design tokens (DOM layer)

## data model
- Photo: id, url, whenCreated (ISODateString), tags (Tag[])
- Cluster: id, whenHappened (ISODateString), photos (Photo[])
- Tag: name, count
- Position and transform logic is computed at render time,
  not stored in data interfaces

## conventions
- BEM naming for CSS classes
- component prop interfaces defined in the component file itself
- data interfaces (Photo, Cluster, Tag) live in types/index.ts
- CSS tokens for DOM layer, numeric constants for 3D layer
- two design token tracks: tokens.css (DOM) and tokens.ts (3D, to be created)
- design system follows: primitives → semantics → styles → components

## current state of the archive
- R3F canvas rendering with orthographic-style perspective camera
- cards rendered as Billboard meshes with picsum.photos textures
- OrbitControls active (zoom + pan disabled, rotation only)
- clusters positioned along diagonal X axis
- routing between home and explore working
- mock data in use, no backend connected

## open decisions
- motion blur silhouette handoff method (download link /
  screen capture / web form camera)
- weather tagging on contributions (manual vs automatic via API)
- notification mechanism when contribution goes live
- contribution form: separate mini-app or route within main platform

## personas
- street passerby (accidental, time-pressured)
- contributor (engaged, on mobile via QR)
- global visitor (intentional, desktop or mobile)
- reoccurring passerby (ambient, familiar with installation)
- local artist (opt-in profile, linked from contribution)
- screen operator (moderation + installation management)