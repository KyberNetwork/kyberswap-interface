import { CSSProperties } from 'styled-components'

function Profile({
  size = 14,
  color,
  style,
  onClick,
}: {
  size?: number
  color?: string
  style?: CSSProperties
  onClick?: () => void
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 54 54`}
      fill="none"
      onClick={onClick}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M27 0.333008C12.28 0.333008 0.333374 12.2797 0.333374 26.9997C0.333374 41.7197 12.28 53.6663 27 53.6663C41.72 53.6663 53.6667 41.7197 53.6667 26.9997C53.6667 12.2797 41.72 0.333008 27 0.333008ZM27 10.9997C32.1467 10.9997 36.3334 15.1863 36.3334 20.333C36.3334 25.4797 32.1467 29.6663 27 29.6663C21.8534 29.6663 17.6667 25.4797 17.6667 20.333C17.6667 15.1863 21.8534 10.9997 27 10.9997ZM27 48.333C21.5867 48.333 15.1867 46.1463 10.6267 40.653C15.1334 37.133 20.8134 34.9997 27 34.9997C33.1867 34.9997 38.8667 37.133 43.3734 40.653C38.8134 46.1463 32.4134 48.333 27 48.333Z"
        fill={color || 'currentColor'}
      />
    </svg>
  )
}

export default Profile
