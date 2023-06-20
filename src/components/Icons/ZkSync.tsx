import useTheme from 'hooks/useTheme'

function ZkSync({ size }: { size?: number }) {
  const theme = useTheme()
  return (
    <svg width={size || 36} height={size || 36} version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700">
      <g transform="translate(0.000000,700.000000) scale(0.100000,-0.100000)" fill={theme.text} stroke="none">
        <path
          d="M4810 4595 l0 -660 -872 -655 -873 -655 873 -3 872 -2 0 -430 c0
-237 3 -430 8 -430 4 0 399 392 877 870 l870 870 -878 878 -877 877 0 -660z"
        />
        <path
          d="M1305 4370 l-870 -870 870 -870 c478 -478 873 -870 877 -870 5 0 8
294 8 653 l0 652 867 650 866 650 -866 3 -867 2 0 435 c0 239 -3 435 -8 435
-4 0 -399 -391 -877 -870z"
        />
      </g>
    </svg>
  )
}

export default ZkSync
