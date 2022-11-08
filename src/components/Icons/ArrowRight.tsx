type Props = { width?: number; height?: number; className?: string }

const ArrowRight: React.FC<Props> = ({ width, height, className }) => {
  return (
    <svg
      className={className}
      width={width || 5}
      height={height || 10}
      viewBox="0 0 5 10"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 10L5 5L-4.37114e-07 0L0 10Z" fill={'currentColor'} />
    </svg>
  )
}

export default ArrowRight
