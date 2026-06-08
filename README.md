<div align="center">

# Noise Portrait Studio

**Thirteen algorithms. One job: look at a photograph and decide it should be something else.**

<br />

<!-- Add a screen recording once you have one: upload a photo, cycle through a few techniques, export.
     Save as docs/demo.gif and uncomment the line below. -->
<!-- <img src="docs/demo.gif" alt="Noise Portrait Studio demo" width="100%" /> -->

[![MIT](https://img.shields.io/badge/license-MIT-22c55e?style=flat)](LICENSE)
&nbsp;
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white&labelColor=20232a)](https://react.dev)
&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
&nbsp;
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
&nbsp;
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

```
  photo .................................................. noise

  ##########  ######  ####  ##  #  .   .     .        .
  ##########  ######  ####  ##  #  .  . .  .   .   .   .
  ##########  ######  ####  ##  #  .    .    .    .    .
  ##########  ######  ####  ##  #  .  .   .  . .   .  .
  ##########  ######  ####  ##  #  .   .     .   .    .
```

Upload any photo. Pick a technique. Tune density, size, seed, color mode. Export as SVG, PNG, or PDF.

---

## The 13 techniques

<!-- Add output screenshots (docs/stipple.png etc.) and swap in the image version of this table -->

<table>
  <tr>
    <td align="center" width="25%">
      <code>·</code><br/>
      <b>Stipple</b><br/>
      <sub>Rejection-sampled dots, denser where it's dark</sub>
    </td>
    <td align="center" width="25%">
      <code>/</code><br/>
      <b>Hatching</b><br/>
      <sub>Strokes aligned to edges via Sobel gradient</sub>
    </td>
    <td align="center" width="25%">
      <code>╳</code><br/>
      <b>Crosshatch</b><br/>
      <sub>Layered hatching — shadows accumulate more passes</sub>
    </td>
    <td align="center" width="25%">
      <code>〰</code><br/>
      <b>Contour</b><br/>
      <sub>Iso-brightness lines via marching squares</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <code>○</code><br/>
      <b>Halftone</b><br/>
      <sub>Staggered hex dot grid, radius = brightness</sub>
    </td>
    <td align="center">
      <code>─</code><br/>
      <b>Scanline</b><br/>
      <sub>Horizontal lines bent by brightness — Joy Division vibes</sub>
    </td>
    <td align="center">
      <code>~</code><br/>
      <b>Flow Strands</b><br/>
      <sub>Lines that follow iso-brightness contours</sub>
    </td>
    <td align="center">
      <code>◎</code><br/>
      <b>Concentric Rings</b><br/>
      <sub>Radiating from center, stroke weight = brightness</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <code>△</code><br/>
      <b>Low Poly</b><br/>
      <sub>Delaunay triangulation over brightness-sampled points</sub>
    </td>
    <td align="center">
      <code>▦</code><br/>
      <b>Mosaic</b><br/>
      <sub>Grid tiles sampled directly from the source image</sub>
    </td>
    <td align="center">
      <code>@</code><br/>
      <b>ASCII Art</b><br/>
      <sub>Character ramp mapped to brightness</sub>
    </td>
    <td align="center">
      <code>✦</code><br/>
      <b>Constellation</b><br/>
      <sub>Delaunay edges, no fill</sub>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="4">
      <code>𝄅</code><br/>
      <b>Painterly</b><br/>
      <sub>Jittered brush strokes with contour-aligned angle</sub>
    </td>
  </tr>
</table>

Three color modes across all of them: monochrome, photo color, or a custom palette.

---

## Stack

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white&labelColor=20232a)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Zustand](https://img.shields.io/badge/Zustand-5-433F3E?style=flat-square)](https://zustand-demo.pmnd.rs)
[![Fabric.js](https://img.shields.io/badge/Fabric.js-6-F0A500?style=flat-square)](http://fabricjs.com)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-FF0050?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion)

```sh
npm install && npm run dev
```

---

## How it actually works

Generation runs off the main thread in a Web Worker. When you hit generate, the image gets decoded into a `Float32Array` brightness map (and an RGBA map for color mode) and transferred to the worker. No copy, no jank. The algorithm computes stroke geometry, sends `StrokeData[]` back, and Fabric.js renders it in batches of 50 so the canvas updates progressively instead of locking up.

Every algorithm uses an XORShift PRNG. The seed lives in the config, so the same image + same seed + same technique produces identical output every time. If you find something good, it's reproducible.

The codebase follows Feature-Sliced Design. Each technique is a self-contained module under `src/shared/lib/techniques/`, each with its own typed payload and render function. Adding a fourteenth algorithm means touching exactly one file and one enum.

---

## Export

SVG output is native Fabric.js, opens in Illustrator, Inkscape, or anything else that matters. PNG rasterizes at canvas resolution. PDF embeds the SVG via jsPDF. All three are print-ready.

---

## License

MIT. Do whatever you want with it. See [LICENSE](LICENSE) for the legal text.
