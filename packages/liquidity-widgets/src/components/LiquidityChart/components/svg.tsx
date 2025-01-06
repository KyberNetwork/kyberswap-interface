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
  [
    `M 0 0`,
    `v 12`,
    `C -10 12 -10 26 0 26`,
    `v ${height - 26}`,
    `m 0 1`,
    `V 26`,
    `C 11 26 11 12 1 12`,
    `V 0`,
    `M 0 1`,
  ].join(" ");

export const brushHandleAccentPath = () =>
  [
    "m 5 7", // move to first accent
    "v 14", // vertical line
    "M 0 0", // move to origin
    "m 9 7", // move to second accent
    "v 14", // vertical line
    "z",
  ].join(" ");

export const OffScreenHandle = ({
  color,
  size = 10,
  margin = 10,
}: {
  color: string;
  size?: number;
  margin?: number;
}) => (
  <polygon
    points={`0 0, ${size} ${size}, 0 ${size}`}
    transform={` translate(${size + margin}, ${margin}) rotate(45) `}
    fill={color}
    stroke={color}
    strokeWidth="4"
    strokeLinejoin="round"
  />
);
