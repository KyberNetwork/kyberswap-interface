import { cn } from 'utils/cn'

const ArrowRight = ({
  width,
  height,
  fill,
  className,
}: {
  width?: number
  height?: number
  fill?: string
  className?: string
}) => {
  return (
    <svg
      width={width || 5}
      height={height || 10}
      viewBox="0 0 5 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-white', className)}
      style={fill ? { color: fill } : undefined}
    >
      <path d="M0 10L5 5L-4.37114e-07 0L0 10Z" fill="currentColor" />
    </svg>
  )
}

export default ArrowRight
