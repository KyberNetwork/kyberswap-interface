import HelpIcon from 'assets/svg/help-circle.svg'

export function Image({
  src,
  alt,
  className,
  width,
  height,
  style,
}: {
  src: string
  alt: string
  className?: string
  width?: string
  height?: string
  style?: React.CSSProperties
}) {
  return (
    <img
      style={style}
      className={className}
      width={width}
      height={height}
      src={src}
      alt={alt}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null // prevents looping
        currentTarget.src = HelpIcon
      }}
    />
  )
}
