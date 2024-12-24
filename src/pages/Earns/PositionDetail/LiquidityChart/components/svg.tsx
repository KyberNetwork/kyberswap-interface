/*
 * Generates an SVG path for the east brush handle.
 * Apply `scale(-1, 1)` to generate west brush handle.
 *
 *    |```````\
 *    |  | |  |
 *    |______/
 *    |
 *    |
 *    |
 *    |
 *    |
 *
 * https://medium.com/@dennismphil/one-side-rounded-rectangle-using-svg-fb31cf318d90
 */
export const brushHandlePath = (height: number) =>
  [`M 0 0`, `v 8`, `C -6 8 -6 18 0 18`, `v ${height - 18}`, `m 0 1`, `V 18`, `C 7 18 7 8 1 8`, `V 0`, `M 0 1`].join(' ')

export const brushHandleAccentPath = () =>
  [
    'm 5 7', // move to first accent
    'v 14', // vertical line
    'M 0 0', // move to origin
    'm 9 7', // move to second accent
    'v 14', // vertical line
    'z',
  ].join(' ')

export const OffScreenHandle = ({
  color,
  size = 10,
  margin = 10,
}: {
  color: string
  size?: number
  margin?: number
}) => (
  <polygon
    points={`0 0, ${size} ${size}, 0 ${size}`}
    transform={` translate(${size + margin}, ${margin}) rotate(45) `}
    fill={color}
    stroke={color}
    strokeWidth="4"
    strokeLinejoin="round"
  />
)
