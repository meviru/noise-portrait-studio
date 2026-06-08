# 🎨 Noise Portrait Studio

> **Turn any photo into generative art.** Upload an image, pick a technique, watch the algorithm go to work — then export as SVG, PNG, or PDF.

```
██████████████████████████████████████████████████
██  ·  ·  · · · · ·   ·  ·  · ·  ·   ·  ·  · ·  ██
██ · ∘ · ∘ · ∘ · ∘  · ∘ · ∘ · ∘ ·  ∘ · ∘ · ∘ · ██
██  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  · ██
██ ·   · · ╔═══════════════════════╗  · ·  · ·   ██
██  · ·  · ║  NOISE PORTRAIT STUDIO ║ · ·  ·  ·  ██
██   ·  ·  ╚═══════════════════════╝   ·  · ·  · ██
██  · ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  · ·  ·  · ██
██████████████████████████████████████████████████
```

---

## What is this?

A photo goes in. Art comes out.

Between those two events, one of **13 generative algorithms** tears your image apart pixel by pixel — measuring brightness, tracing contours, triangulating edges — and reconstructs it as something you'd hang on a wall.

No filters. No LUTs. Pure math.

---

## The Techniques

Each one is a different way of answering the same question: *how do you describe a photograph using only lines, dots, and geometry?*

| Technique | Vibe | Algorithm |
|-----------|------|-----------|
| **Stipple** | Newspaper up close | Rejection-sampling dots weighted by darkness |
| **Hatching** | Pencil sketch | Sobel-gradient strokes aligned to edges |
| **Crosshatch** | Ink illustration | Multi-layer hatching, darker = more layers |
| **Contour** | Topographic map | Marching squares at iso-brightness levels |
| **Halftone** | Offset print | Staggered hex grid, dot radius = darkness |
| **Scanline** | Joy Division album cover | Horizontal lines deflected vertically by brightness |
| **Flow Strands** | Hair in wind | Lines that follow iso-brightness contours |
| **Concentric Rings** | Ripples | Rings from center, stroke weight = brightness |
| **Low Poly** | Stained glass | Delaunay triangulation over brightness-sampled points |
| **Mosaic** | Tile mural | Grid tiles sampled directly from source pixels |
| **ASCII Art** | Terminal aesthetic | Character ramp mapped to brightness (` ·:+*#@`) |
| **Constellation** | Night sky | Points connected via Delaunay edges |
| **Painterly** | Oil painting | Brush strokes with jitter, contour-aligned angle |

---

## Features

```
┌─────────────────────────────────────────────────────┐
│  Upload photo  →  Pick technique  →  Tune controls   │
│                                                       │
│  ┌─────────────┐    ┌────────────────────────────┐   │
│  │   Sidebar   │    │         Canvas             │   │
│  │  ─────────  │    │                            │   │
│  │  Presets    │    │   ·  · · ∘  · ·  ·  · ∘   │   │
│  │  Density    │    │  ∘  ·  ·  · ∘  · ·  ·  ·  │   │
│  │  Size       │    │   · · ·∘·  · · ·  ∘ ·  ·  │   │
│  │  Opacity    │    │  ·  ·  ·  ·  ·  ·  ·  ·   │   │
│  │  Colors     │    │                            │   │
│  │  Seed       │    │  [zoom] [pan] [export]     │   │
│  └─────────────┘    └────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

- **13 generative techniques** with individual parameter controls
- **3 color modes** — Monochrome, Photo Color, Palette
- **Reproducible results** via seeded randomness (same seed = same output, always)
- **Export to SVG, PNG, or PDF** with full canvas fidelity
- **Web Worker generation** — the UI stays responsive while it renders
- **Zoom & pan** the canvas; touch-friendly on mobile
- **Responsive layout** — sidebar on desktop, bottom nav on mobile

---

## Tech Stack

```
React 19  ·  TypeScript 6  ·  Zustand 5  ·  Fabric.js 6
Vite 8  ·  Tailwind CSS 4  ·  Framer Motion 12  ·  jsPDF 4
```

### Architecture highlights

**Feature-Sliced Design** — code is organized by feature, not by type:

```
src/
├── app/              # Store (Zustand + Immer), providers
├── features/
│   ├── generate/     # Web Worker + renderToFabric pipeline
│   ├── export/       # SVG / PNG / PDF export
│   ├── image-upload/ # Photo ingestion + brightness map
│   └── presets/      # Preset management
├── entities/         # Domain types (StrokeData)
├── widgets/          # Canvas panel, sidebar, mobile nav
├── pages/            # StudioPage
└── shared/
    ├── lib/
    │   ├── techniques/   # ← all 13 algorithms live here
    │   ├── fabric/       # Canvas setup & interaction
    │   └── utils/        # seededRandom, clamp, mapRange
    ├── ui/               # Button, Slider, Dropzone
    └── constants/        # Dimensions, palettes, strings
```

**The generation pipeline:**

```
Image upload
    ↓
HTMLCanvas → grayscale Float32Array (brightness map)
    ↓
postMessage → Web Worker
    ↓
Technique algorithm runs (dots / lines / triangles computed)
    ↓
StrokeData[] transferred back to main thread
    ↓
Fabric.js renders in batches of 50 (no jank)
    ↓
Canvas ready → export whenever
```

**Seeded randomness** — every technique uses an XORShift PRNG seeded from the config, so the same photo + same seed + same technique = identical output. Sharing results is reproducible by design.

---

## Getting Started

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Tests
npm run test
```

---

## How the algorithms actually work

For the curious:

**Stipple** uses rejection sampling — it picks random points, checks brightness at that pixel, and keeps the point only if a second random number is below that brightness value. Dark areas are dense; bright areas are sparse.

**Hatching** runs a Sobel filter over the image to find edge gradients, then draws strokes perpendicular to the gradient direction. The result looks like a hand-drawn sketch because that's effectively what the algorithm is simulating.

**Contour** implements marching squares: divide the canvas into a grid, compute brightness at each corner, then trace which edges the iso-brightness threshold crosses. Walk the resulting path across the whole image. Repeat for each contour level.

**Low Poly** samples the image at brightness-weighted random points (more samples in high-detail areas), runs Delaunay triangulation over them, then fills each triangle with the color sampled at its centroid.

**Flow Strands** treats the brightness gradient as a vector field and integrates along it — each strand "flows" along lines of equal brightness like water following a contour.

---

## Export Quality

All outputs are vector-first where the technique allows it:

| Format | Notes |
|--------|-------|
| **SVG** | Native Fabric.js export — fully scalable, editable in Illustrator/Inkscape |
| **PNG** | Canvas rasterized at screen resolution |
| **PDF** | jsPDF with SVG embedded — print-ready |

---

## License

MIT

---

<div align="center">

*Every pixel is a decision. Every dot is deliberate.*

</div>
