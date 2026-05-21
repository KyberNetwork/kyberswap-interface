import { HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

type CardProps = HTMLAttributes<HTMLDivElement>

const base = 'w-full rounded-[20px] p-5'

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn(base, className)} {...rest} />
))
Card.displayName = 'Card'
export default Card

export const BlackCard = forwardRef<HTMLDivElement, CardProps>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn(base, 'bg-buttonBlack', className)} {...rest} />
))
BlackCard.displayName = 'BlackCard'

export const LightCard = forwardRef<HTMLDivElement, CardProps>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn(base, 'border border-bg2 bg-bg1', className)} {...rest} />
))
LightCard.displayName = 'LightCard'

export const OutlineCard = forwardRef<HTMLDivElement, CardProps>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn(base, 'border border-border', className)} {...rest} />
))
OutlineCard.displayName = 'OutlineCard'

export const WarningCard = forwardRef<HTMLDivElement, CardProps>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn(base, 'bg-warning-25 font-medium text-text', className)} {...rest} />
))
WarningCard.displayName = 'WarningCard'
