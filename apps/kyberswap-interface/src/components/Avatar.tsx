import { CSSProperties } from 'react'

import Profile from 'components/Icons/Profile'
import Loader from 'components/Loader'

export default function Avatar({
  url,
  size,
  color,
  className,
  onClick,
  style,
  loading,
}: {
  url: string | undefined
  size: number
  color?: string
  className?: string
  onClick?: () => void
  style?: CSSProperties
  loading?: boolean
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {url ? (
        <img
          src={url}
          onClick={onClick}
          className="rounded-full object-cover"
          style={{ width: size, height: size, ...style }}
        />
      ) : (
        <Profile
          size={size}
          color={color}
          className={className}
          style={{ ...style, minHeight: size, minWidth: size }}
          onClick={onClick}
        />
      )}
      {loading && (
        <div
          className="absolute left-0 top-0 flex items-center justify-center rounded-full bg-buttonBlack-60"
          style={{ width: size, height: size }}
        >
          <Loader />
        </div>
      )}
    </div>
  )
}
