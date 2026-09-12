import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'

const TEXT_SKELETON_SIZE_PRESETS = {
  sm: { height: 14, lineHeight: 20 },
  base: { height: 18, lineHeight: 24 },
  lg: { height: 20, lineHeight: 28 },
  '2xl': { height: 24, lineHeight: 32 },
} as const

type TextSkeletonProps = Omit<React.ComponentProps<typeof TableCellSkeleton>, 'height'> & {
  size?: keyof typeof TEXT_SKELETON_SIZE_PRESETS
  height?: number
  lineHeight?: number
}

/**
 * Static text placeholder centered within the line box used by the real text.
 *
 * Match `size` to the rendered text utility. `height` and `lineHeight` can
 * override a preset for text with custom line-height geometry.
 *
 * Standalone text skeletons animate by default. When an ancestor already owns
 * `animate-pulse`, this component disables its nested animation so the group
 * pulses once in sync.
 */
const TextSkeleton = ({ size = 'base', height, lineHeight, ...props }: TextSkeletonProps) => {
  const preset = TEXT_SKELETON_SIZE_PRESETS[size]

  return (
    <div
      className="flex animate-pulse items-center [.animate-pulse_&]:animate-none"
      style={{ height: lineHeight ?? preset.lineHeight }}
    >
      <TableCellSkeleton {...props} height={height ?? preset.height} />
    </div>
  )
}

export default TextSkeleton
