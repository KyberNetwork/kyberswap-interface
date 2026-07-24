import React from 'react'

import sprite from 'assets/svg/sprite.svg'
import { cn } from 'utils/cn'

const ICON_IDS = [
  'truesight-v2',
  'notification-2',
  'bullish',
  'bearish',
  'trending-soon',
  'flame',
  'download',
  'upload',
  'coin-bag',
  'check',
  'pig',
  'speaker',
  'share',
  'liquid-outline',
  'refund',
  'swap',
  'copy',
  'open-link',
  'star',
  'fullscreen',
  'leaderboard',
  'liquid',
  'alarm',
  'on-chain',
  'technical-analysis',
  'liquidity-analysis',
  'news',
  'arrow',
  'chart',
  'lightbulb',
  'info',
  'question',
  'timer',
  'search',
  'devices',
  'eth-mono',
  'ava-mono',
  'bnb-mono',
  'matic-mono',
  'fantom-mono',
  'optimism-mono',
  'arbitrum-mono',
  'telegram',
  'twitter',
  'facebook',
  'discord',
  'assignment',
  'drag-indicator',
  'pencil',
  'trash',
] as const

type IconId = (typeof ICON_IDS)[number]

export default function Icon({
  id,
  size,
  style,
  color,
  className,
  ...rest
}: {
  id: IconId
  size?: number | string
  color?: string
  style?: React.CSSProperties
  className?: string
  title?: string
}) {
  return (
    <div style={color ? { ...style, color } : style} className={cn(className)} {...rest}>
      <svg width={size || 24} height={size || 24} display="block">
        <use href={`${sprite}#${id}`} width={size || 24} height={size || 24} />
      </svg>
    </div>
  )
}
