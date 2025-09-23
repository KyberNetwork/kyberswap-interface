import styled, { keyframes } from 'styled-components'

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const rotateReverse = keyframes`
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
`

const StyledSVG = styled.svg<{ size: string; stroke?: string }>`
  animation: 2s ${rotate} linear infinite;
  height: ${({ size }) => size};
  width: ${({ size }) => size};

  path {
    stroke: ${({ stroke, theme }) => stroke ?? theme.primary};
  }
`

const StyledSVG2 = styled.svg<{ size: string }>`
  animation: 2s ${rotateReverse} linear infinite;
  height: ${({ size }) => size};
  width: ${({ size }) => size};
`

/**
 * Takes in custom size and stroke for circle color, default to primary color as fill,
 * need ...rest for layered styles on top
 */
export default function Loader({
  size = '16px',
  stroke,
  strokeWidth = '2.5',
  ...rest
}: {
  size?: string
  stroke?: string
  strokeWidth?: string
  [k: string]: any
}) {
  const sWN = Number(strokeWidth)
  // viewbox for stroke width:
  // stroke width = 1 => viewbox = 1.5 1.5 21 21
  // stroke width = 2 => viewbox = 1 1 22 22
  // stroke width = 2.5 => viewbox = 0.75 0.75 22.5 22.5
  // stroke width = 3 => viewbox = 0.5 0.5 23 23
  // stroke width = 4 => viewbox = 0 0 24 24
  // stroke width = 5 => viewbox = -0.5 -0.5 25 25
  const viewBox = `${2 - sWN / 2} ${2 - sWN / 2} ${20 + sWN} ${20 + sWN}`

  return (
    <StyledSVG viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" size={size} stroke={stroke} {...rest}>
      <path
        d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 9.27455 20.9097 6.80375 19.1414 5"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSVG>
  )
}

export const Loader2 = ({ size = 16 }: { size?: number }) => {
  return (
    <StyledSVG2 fill="none" viewBox="0 0 24 24" size={`${size}px`}>
      <g clipPath="url(#paint0_angular_8201_49757_clip_path)" data-figma-skip-parse="true">
        <g transform="matrix(0 0.012 -0.012 0 12 12)">
          <foreignObject x="-1083.33" y="-1083.33" width="2166.67" height="2166.67">
            <div
              style={{
                background: 'conic-gradient(from 90deg,rgba(29, 233, 182, 1) 0deg,rgba(196, 196, 196, 0) 360deg)',
                height: '100%',
                width: '100%',
                opacity: 1,
              }}
            ></div>
          </foreignObject>
        </g>
      </g>
      <path
        d="M24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12ZM2.8562 12C2.8562 17.05 6.95002 21.1438 12 21.1438C17.05 21.1438 21.1438 17.05 21.1438 12C21.1438 6.95002 17.05 2.8562 12 2.8562C6.95002 2.8562 2.8562 6.95002 2.8562 12Z"
        data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_ANGULAR&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.11372549086809158,&#34;g&#34;:0.91372549533843994,&#34;b&#34;:0.71372550725936890,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.76862746477127075,&#34;g&#34;:0.76862746477127075,&#34;b&#34;:0.76862746477127075,&#34;a&#34;:0.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[],&#34;transform&#34;:{&#34;m00&#34;:1.4695762231022014e-15,&#34;m01&#34;:-24.0,&#34;m02&#34;:24.0,&#34;m10&#34;:24.0,&#34;m11&#34;:1.4695762231022014e-15,&#34;m12&#34;:-1.4695762231022014e-15},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"
      />
      <defs>
        <clipPath id="paint0_angular_8201_49757_clip_path">
          <path d="M24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12ZM2.8562 12C2.8562 17.05 6.95002 21.1438 12 21.1438C17.05 21.1438 21.1438 17.05 21.1438 12C21.1438 6.95002 17.05 2.8562 12 2.8562C6.95002 2.8562 2.8562 6.95002 2.8562 12Z" />
        </clipPath>
      </defs>
    </StyledSVG2>
  )
}
