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
      onClick={onClick}
      style={style}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.99992 0.333008C3.31992 0.333008 0.333252 3.31967 0.333252 6.99967C0.333252 10.6797 3.31992 13.6663 6.99992 13.6663C10.6799 13.6663 13.6666 10.6797 13.6666 6.99967C13.6666 3.31967 10.6799 0.333008 6.99992 0.333008ZM6.99992 2.99967C8.28659 2.99967 9.33325 4.04634 9.33325 5.33301C9.33325 6.61967 8.28659 7.66634 6.99992 7.66634C5.71325 7.66634 4.66659 6.61967 4.66659 5.33301C4.66659 4.04634 5.71325 2.99967 6.99992 2.99967ZM6.99992 12.333C5.64659 12.333 4.04659 11.7863 2.90659 10.413C4.03325 9.53301 5.45325 8.99967 6.99992 8.99967C8.54659 8.99967 9.96659 9.53301 11.0933 10.413C9.95325 11.7863 8.35325 12.333 6.99992 12.333Z"
        fill={color || 'currentColor'}
      />
    </svg>
  )
}

export default Profile
