interface SliderProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
}

/**
 * Labeled range input with an optional value formatter displayed inline.
 */
export function Slider({ label, min, max, step, value, onChange, formatValue }: SliderProps) {
  const display = formatValue ? formatValue(value) : String(value)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">{label}</span>
        <span className="text-sm font-medium text-neutral-100">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="w-full h-1 accent-primary-600 cursor-pointer"
      />
    </div>
  )
}
