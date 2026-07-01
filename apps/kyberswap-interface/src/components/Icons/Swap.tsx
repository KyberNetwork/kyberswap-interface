import { cn } from 'utils/cn'

function Swap({
  size = 20,
  color,
  rotate,
  className,
}: {
  size?: number
  color?: string
  rotate?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      transform={rotate ? `rotate(${rotate})` : 'none'}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      style={color ? { color } : undefined}
    >
      <path
        d="M7.4 2.4L11 6H8.4V12H6.4V6H3.8L7.4 2.4ZM12.6 17.6L9 14H11.6V8H13.6V14H16.2L12.6 17.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default Swap
