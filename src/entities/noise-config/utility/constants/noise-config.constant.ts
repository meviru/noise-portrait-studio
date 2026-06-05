/**
 * Rendering technique applied to the brightness map.
 */
export enum TechniqueId {
  Stipple = 'stipple',
  Hatch = 'hatch',
  Contour = 'contour',
  Crosshatch = 'crosshatch',
}

/**
 * Color source used when drawing each rendered element.
 */
export enum ColorMode {
  Mono = 'mono',
  Photo = 'photo',
  Palette = 'palette',
}
