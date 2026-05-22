import { ReactNode } from 'react'

import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'

export default function ProgressBar({
  label,
  value,
  percent = 0,
  color,
  valueColor,
  backgroundColor,
  labelColor,
  width,
  height = '6px',
  loading = false,
}: {
  label?: string
  value?: ReactNode
  percent?: number
  color?: string // bar color
  valueColor?: string
  backgroundColor?: string // deactive bar color
  labelColor?: string
  width?: string
  height?: string
  loading?: boolean
}) {
  const theme = useTheme()
  const normalizedPercent = Math.min(100, Math.max(0, percent))
  const effectivePercent = loading ? 0 : normalizedPercent < 0.5 ? 0 : normalizedPercent

  return (
    <div className="flex flex-col gap-[5px]">
      {label && value ? (
        <div className="flex justify-between text-xs leading-normal" style={{ color: labelColor || theme.subText }}>
          {label} <span style={{ color: valueColor || theme.subText }}>{value}</span>
        </div>
      ) : null}
      <div
        className="relative rounded-full"
        style={{ height, width: width ?? 'unset', background: backgroundColor || 'rgba(182, 182, 182, 0.2)' }}
      >
        <div
          className={cn(
            'absolute left-0 top-0 h-full overflow-hidden rounded-full',
            !loading && effectivePercent !== 0 && 'min-w-2',
          )}
          style={{
            background: loading ? theme.tableHeader : color || theme.primary,
            width: loading ? '100%' : `${effectivePercent}%`,
          }}
        >
          {loading && (
            <div
              className="absolute inset-0 w-2/5 animate-loading-shimmer"
              style={{
                background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
