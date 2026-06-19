import { cn } from 'utils/cn'

function ShieldChecked({ size, color, className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg
      width={size || 24}
      height={size || 24}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      style={color ? { color } : undefined}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.3334 7.45455C13.3334 10.4819 11.058 13.3125 8.00002 13.9999C4.94202 13.3125 2.66669 10.4819 2.66669 7.45455V5.07655C2.66669 4.53521 2.99402 4.04721 3.49535 3.84255L6.82869 2.47855C7.57935 2.17121 8.42069 2.17121 9.17135 2.47855L12.5047 3.84255C13.006 4.04788 13.3334 4.53521 13.3334 5.07655V7.45455V7.45455Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.1667 6.75L7.66669 9.25L6.16669 7.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ShieldChecked
