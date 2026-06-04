export const STRINGS = {
  upload: {
    instruction: 'Drop a photo here',
    subInstruction: 'or click to browse',
    processing: 'Processing…',
    replace: 'Replace',
    errors: {
      invalidType: 'Please upload a JPEG or PNG image.',
      loadFailed: 'Failed to load image. Please try another file.',
      readFailed: 'Failed to read file.',
    },
  },
  generate: {
    button: 'Generate',
    rerender: 'Re-render',
    cancel: 'Cancel',
  },
  renderState: {
    idle: 'Upload a photo to begin',
    computing: 'Computing flow field…',
    rendering: 'Rendering strokes…',
    done: 'Done',
    error: 'Render failed. Please try again.',
  },
  export: {
    svg: 'Export SVG',
    png: 'Export PNG',
    pdf: 'Export PDF',
    exporting: 'Exporting…',
  },
  sidebar: {
    presets: 'Style Preset',
    parameters: 'Parameters',
    palette: 'Colour Palette',
    seed: 'Seed',
  },
} as const
