import { CSSProperties } from 'react'

const Withdraw = ({ width, height, style }: { width?: number; height?: number; style?: CSSProperties }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width || 16} height={height || 16} viewBox="0 0 16 16" style={style}>
      <path
        d="M3.33337 3.33317C3.33337 3.69984 3.63337 3.99984 4.00004 3.99984H12C12.3667 3.99984 12.6667 3.69984 12.6667 3.33317C12.6667 2.9665 12.3667 2.6665 12 2.6665H4.00004C3.63337 2.6665 3.33337 2.9665 3.33337 3.33317ZM4.94004 9.33317H6.00004V12.6665C6.00004 13.0332 6.30004 13.3332 6.66671 13.3332H9.33337C9.70004 13.3332 10 13.0332 10 12.6665V9.33317H11.06C11.6534 9.33317 11.9534 8.61317 11.5334 8.19317L8.47337 5.13317C8.21337 4.87317 7.79337 4.87317 7.53337 5.13317L4.47337 8.19317C4.05337 8.61317 4.34671 9.33317 4.94004 9.33317Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default Withdraw
