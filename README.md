# Noise Portrait Studio

Thirteen algorithms. One job: look at a photograph and decide it should be something else.

```
         same photo · two algorithms

  ┌─ stipple ──────────────────┐  ┌─ scanline ─────────────────┐
  │  · · · ∙ · · ∙ · · ∙ · ·  │  │  ──────────────────────── │
  │ ·∙·∙· ●  ·∙·∙·∙· ●  ·∙·  │  │  ────● ────────────● ───── │
  │ ·∙·∙·∙·∙·∙·∙·∙·∙·∙·∙·∙·  │  │  ──────────────────────── │
  │ ·∙·∙·∙·∙·∙·∙·∙·∙·∙·∙·∙·  │  │  ──────────────────────── │
  │ ·∙·∙· ‿‿‿‿‿‿‿ ·∙·∙·∙·∙·  │  │  ──────╰────────╯──────── │
  │  · · · ∙ · · ∙ · · ∙ · ·  │  │  ──────────────────────── │
  └────────────────────────────┘  └────────────────────────────┘
```

Upload any photo. Pick a technique. Tune density, size, seed, color mode. Export as SVG, PNG, or PDF. That's it.

---

## The 13 techniques

| | Technique | What it does |
|---|---|---|
| `·` | **Stipple** | Rejection-sampled dots — dark areas get more, bright areas get fewer |
| `/` | **Hatching** | Strokes aligned to image edges via Sobel gradient |
| `╳` | **Crosshatch** | Same as hatching but layered; shadows accumulate more passes |
| `〰` | **Contour** | Iso-brightness lines via marching squares — looks like a topo map |
| `○` | **Halftone** | Staggered hex dot grid, radius = brightness |
| `─` | **Scanline** | Horizontal lines bent vertically by brightness; basically a Joy Division cover generator |
| `~` | **Flow Strands** | Lines that integrate along iso-brightness contours |
| `◎` | **Concentric Rings** | Rings radiating from center, stroke weight = brightness |
| `△` | **Low Poly** | Delaunay triangulation over brightness-sampled points |
| `▦` | **Mosaic** | Grid tiles sampling directly from the source image |
| `@` | **ASCII Art** | Character ramp (` ·:+*#@`) mapped to brightness |
| `✦` | **Constellation** | Delaunay edges with no fill — stars connected by lines |
| `𝄅` | **Painterly** | Jittered brush strokes with contour-aligned angle |

Three color modes across all of them: monochrome, photo color, or a custom palette.

---

## Stack

React 19 · TypeScript 6 · Zustand 5 · Fabric.js 6 · Vite 8 · Tailwind 4 · Framer Motion 12

```sh
npm install && npm run dev
```

---

## How it actually works

Generation runs off the main thread in a Web Worker. When you hit generate, the image gets decoded into a `Float32Array` brightness map (and an RGBA map for color mode) and transferred to the worker — no copy, no jank. The algorithm computes stroke geometry, sends `StrokeData[]` back, and Fabric.js renders it in batches of 50 so the canvas updates progressively instead of locking up.

Every algorithm uses an XORShift PRNG. The seed lives in the config, so the same image + same seed + same technique produces identical output every time. If you find something good, it's reproducible.

The codebase follows Feature-Sliced Design — each technique is a self-contained module under `src/shared/lib/techniques/`, each with its own typed payload and render function. Adding a fourteenth algorithm means touching exactly one file and one enum.

---

## Export

SVG output is native Fabric.js — opens in Illustrator, Inkscape, or anything else that matters. PNG rasterizes at canvas resolution. PDF embeds the SVG via jsPDF. All three are print-ready.

---

MIT
