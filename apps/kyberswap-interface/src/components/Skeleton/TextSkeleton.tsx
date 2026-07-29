import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'

const TEXT_SKELETON_SIZE_PRESETS = {
  sm: { height: 14, lineHeight: 20 },
  base: { height: 18, lineHeight: 24 },
} as const

type TextSkeletonProps = Omit<React.ComponentProps<typeof TableCellSkeleton>, 'height'> & {
  size?: keyof typeof TEXT_SKELETON_SIZE_PRESETS
  height?: number
  lineHeight?: number
}

/**
 * Static text placeholder centered within the line box used by the real text.
 *
 * Use `sm` for text-sm and `base` for text-base geometry. `height` and
 * `lineHeight` can override the selected preset when needed.
 *
 * Animation is owned by the surrounding skeleton container.
 */
const TextSkeleton = ({ size = 'base', height, lineHeight, ...props }: TextSkeletonProps) => {
  const preset = TEXT_SKELETON_SIZE_PRESETS[size]

  return (
    <div className="flex items-center" style={{ height: lineHeight ?? preset.lineHeight }}>
      <TableCellSkeleton {...props} height={height ?? preset.height} />
    </div>
  )
}

export default TextSkeleton
