import { forceCollide, forceManyBody, forceSimulation, forceX, forceY } from 'd3'
import { useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled, { keyframes } from 'styled-components'

type BubbleSize = 'xl' | 'lg' | 'md' | 'sm'
type BubbleTone = 'bull' | 'bear' | 'neutral'

export type BubbleToken = {
  id: string
  symbol: string
  change: number
  size: BubbleSize
  tone: BubbleTone
  score?: number
}

type PackedToken = BubbleToken & {
  x: number
  y: number
  r: number
  diameter: number
  sizePx: number
  delay: string
  duration: string
  drift: string
}
type ForceNode = BubbleToken & { x: number; y: number; r: number; anchorX: number; anchorY: number; sizePx: number }

const sizeMap: Record<BubbleSize, number> = {
  xl: 160,
  lg: 120,
  md: 100,
  sm: 80,
}

export default function BubbleTokens({ tokens = [], randomizeKey }: { tokens?: BubbleToken[]; randomizeKey?: number }) {
  const [pulseTick, setPulseTick] = useState(0)

  useEffect(() => {
    if (randomizeKey === undefined) return
    setPulseTick(tick => tick + 1)
  }, [randomizeKey])

  const arranged = useMemo<PackedToken[]>(() => {
    const baseWidth = 600
    const baseHeight = 400
    const paddingPx = 12
    const gapPx = 8
    const total = tokens.length
    const layoutWidth = 100
    const layoutHeight = (baseHeight / baseWidth) * 100
    const baseSeed = hashString(`${tokens.map(t => t.id).join('|')}|${randomizeKey ?? 0}`)

    const padding = (paddingPx / baseWidth) * 100
    const gap = (gapPx / baseWidth) * 100

    const totalAreaPx = tokens.reduce((sum, token) => sum + sizeMap[token.size] * sizeMap[token.size], 0)
    const availableAreaPx = (baseWidth - paddingPx * 2) * (baseHeight - paddingPx * 2)
    const baseScale = Math.min(1, Math.sqrt(availableAreaPx / Math.max(1, totalAreaPx)) * 0.94)

    const buildLayout = (scale: number, seedOffset: number) => {
      const rng = mulberry32((baseSeed + seedOffset * 99991) >>> 0)
      const anchors = Array.from({ length: total }, () => ({
        x: rng() * layoutWidth,
        y: rng() * layoutHeight,
      }))
      const nodes: ForceNode[] = tokens.map((token, index) => {
        const sizePx = sizeMap[token.size] * scale
        const diameter = (sizePx / baseWidth) * 100
        const r = diameter / 2
        const anchor = anchors[index]
        return {
          ...token,
          r,
          sizePx,
          anchorX: anchor.x,
          anchorY: anchor.y,
          x: anchor.x,
          y: anchor.y,
        }
      })

      const simulation = forceSimulation<ForceNode>(nodes)
        .force('charge', forceManyBody<ForceNode>().strength(-4))
        .force('x', forceX<ForceNode>(d => d.anchorX).strength(0.35))
        .force('y', forceY<ForceNode>(d => d.anchorY).strength(0.35))
        .force(
          'collide',
          forceCollide<ForceNode>()
            .radius(d => d.r + gap)
            .iterations(4),
        )
        .stop()

      for (let i = 0; i < 360; i += 1) {
        simulation.tick()
      }

      const resolved = nodes.map(node => ({
        ...node,
        x: clamp(node.x ?? layoutWidth / 2, node.r + padding, layoutWidth - node.r - padding),
        y: clamp(node.y ?? layoutHeight / 2, node.r + padding, layoutHeight - node.r - padding),
      }))

      for (let iter = 0; iter < 220; iter += 1) {
        let moved = false
        for (let i = 0; i < resolved.length; i += 1) {
          for (let j = i + 1; j < resolved.length; j += 1) {
            const a = resolved[i]
            const b = resolved[j]
            const ax1 = a.x - a.r - gap
            const ax2 = a.x + a.r + gap
            const ay1 = a.y - a.r - gap
            const ay2 = a.y + a.r + gap
            const bx1 = b.x - b.r - gap
            const bx2 = b.x + b.r + gap
            const by1 = b.y - b.r - gap
            const by2 = b.y + b.r + gap
            const overlapX = Math.min(ax2, bx2) - Math.max(ax1, bx1)
            const overlapY = Math.min(ay2, by2) - Math.max(ay1, by1)
            if (overlapX > 0 && overlapY > 0) {
              moved = true
              if (overlapX < overlapY) {
                const shift = overlapX / 2
                if (a.x < b.x) {
                  a.x -= shift
                  b.x += shift
                } else {
                  a.x += shift
                  b.x -= shift
                }
              } else {
                const shift = overlapY / 2
                if (a.y < b.y) {
                  a.y -= shift
                  b.y += shift
                } else {
                  a.y += shift
                  b.y -= shift
                }
              }
            }
          }
        }
        for (let i = 0; i < resolved.length; i += 1) {
          const node = resolved[i]
          node.x = clamp(node.x, node.r + padding, layoutWidth - node.r - padding)
          node.y = clamp(node.y, node.r + padding, layoutHeight - node.r - padding)
        }
        if (!moved) break
      }

      let hasOverlap = false
      let overlapCount = 0
      for (let i = 0; i < resolved.length; i += 1) {
        for (let j = i + 1; j < resolved.length; j += 1) {
          const a = resolved[i]
          const b = resolved[j]
          const ax1 = a.x - a.r - gap
          const ax2 = a.x + a.r + gap
          const ay1 = a.y - a.r - gap
          const ay2 = a.y + a.r + gap
          const bx1 = b.x - b.r - gap
          const bx2 = b.x + b.r + gap
          const by1 = b.y - b.r - gap
          const by2 = b.y + b.r + gap
          const overlapX = Math.min(ax2, bx2) - Math.max(ax1, bx1)
          const overlapY = Math.min(ay2, by2) - Math.max(ay1, by1)
          if (overlapX > 0 && overlapY > 0) {
            hasOverlap = true
            overlapCount += 1
          }
        }
      }

      return { resolved, hasOverlap, overlapCount, scale }
    }

    let bestLayout = buildLayout(baseScale, 0)
    if (bestLayout.hasOverlap) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        let scale = baseScale
        let layout = buildLayout(scale, attempt)
        for (let shrink = 0; shrink < 6 && layout.hasOverlap; shrink += 1) {
          scale *= 0.92
          layout = buildLayout(scale, attempt)
        }
        if (!layout.hasOverlap) {
          bestLayout = layout
          break
        }
        if (
          layout.overlapCount < bestLayout.overlapCount ||
          (layout.overlapCount === bestLayout.overlapCount && layout.scale > bestLayout.scale)
        ) {
          bestLayout = layout
        }
      }
    }

    return bestLayout.resolved.map((node, index) => ({
      ...node,
      x: (node.x / layoutWidth) * 100,
      y: (node.y / layoutHeight) * 100,
      diameter: node.r * 2,
      delay: `${(index % 7) * 0.3}s`,
      duration: `${7 + (index % 5)}s`,
      drift: `${6 + (index % 4) * 2}px`,
      sizePx: node.sizePx,
    }))
  }, [randomizeKey, tokens])

  return (
    <Frame>
      <BubbleField>
        {arranged.map(token => {
          return (
            <Bubble
              key={token.id}
              tone={token.tone}
              style={{
                left: `${token.x}%`,
                top: `${token.y}%`,
                ['--bubble-size' as string]: `${token.diameter}%`,
                ['--bubble-font' as string]: `${Math.max(11, token.sizePx * 0.12)}px`,
                ['--bubble-sub-font' as string]: `${Math.max(9, token.sizePx * 0.1)}px`,
                ['--bubble-pad' as string]: `${Math.max(10, token.sizePx * 0.12)}px`,
                ['--bubble-dot' as string]: `${Math.max(20, token.sizePx * 0.2)}px`,
                ['--float-delay' as string]: token.delay,
                ['--float-duration' as string]: token.duration,
                ['--float-drift' as string]: token.drift,
              }}
            >
              <BubbleInner key={`${token.id}-${pulseTick}`} tone={token.tone}>
                {token.score !== undefined && <BubbleBadge>{token.score}</BubbleBadge>}
                <BubbleBody>
                  <SymbolRow>
                    <TokenDot tone={token.tone}>{token.symbol[0]}</TokenDot>
                    <Text fontSize="var(--bubble-font)">{token.symbol}</Text>
                  </SymbolRow>
                  <ChangeText tone={token.tone} fontSize="var(--bubble-sub-font)">
                    {token.change > 0 ? `+${token.change.toFixed(2)}%` : `${token.change.toFixed(2)}%`}
                  </ChangeText>
                </BubbleBody>
              </BubbleInner>
            </Bubble>
          )
        })}
      </BubbleField>
    </Frame>
  )
}

const popIn = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(0.94);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
`

const bob = keyframes`
  0% {
    transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) translate3d(0, calc(var(--float-drift) * -1), 0) scale(1.01);
  }
  100% {
    transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(1);
  }
`

const pulse = keyframes`
  0% {
    transform: scale(0.96);
  }
  60% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
`

const Frame = styled.div`
  display: flex;
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  aspect-ratio: 3 / 2;
  padding: 24px;
  border-radius: 28px;
  background: radial-gradient(120% 120% at 0% 0%, rgba(0, 255, 194, 0.08), transparent 60%),
    radial-gradient(80% 80% at 100% 20%, rgba(255, 0, 88, 0.12), transparent 65%),
    linear-gradient(145deg, rgba(12, 18, 23, 0.96), rgba(7, 12, 18, 0.96));
  box-shadow: inset 0 0 0 2px rgba(60, 255, 214, 0.15), 0 25px 60px rgba(0, 0, 0, 0.45);
`

const BubbleField = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  aspect-ratio: 3 / 2;
`

const Bubble = styled.div<{ tone: BubbleTone }>`
  position: absolute;
  width: var(--bubble-size);
  aspect-ratio: 1 / 1;
  box-sizing: border-box;
  animation: ${popIn} 0.5s ease-out var(--float-delay) both,
    ${bob} var(--float-duration) ease-in-out calc(0.6s + var(--float-delay)) infinite;
  transform-origin: center;
  transition: left 0.6s ease, top 0.6s ease, width 0.6s ease;
`

const BubbleInner = styled(Flex)<{ tone: BubbleTone }>`
  width: 100%;
  height: 100%;
  border-radius: 16px;
  padding: var(--bubble-pad);
  align-items: flex-end;
  justify-content: flex-start;
  gap: 10px;
  color: #d8fff0;
  background: ${({ tone }) =>
    tone === 'bull'
      ? 'linear-gradient(160deg, #1fd1a0 0%, #0c8b6a 100%)'
      : tone === 'bear'
      ? 'linear-gradient(160deg, #d65b7c 0%, #7a1028 100%)'
      : 'linear-gradient(160deg, #8d8d8d 0%, #4a4a4a 100%)'};
  box-shadow: inset 0 -10px 30px rgba(0, 0, 0, 0.35), inset 0 10px 30px rgba(255, 255, 255, 0.08),
    0 20px 40px rgba(0, 0, 0, 0.35);
  animation: ${pulse} 0.35s ease-out;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: inset 0 -10px 30px rgba(0, 0, 0, 0.35), inset 0 10px 30px rgba(255, 255, 255, 0.12),
      0 24px 50px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba(120, 255, 220, 0.3);
    transform: scale(1.03);
  }
`

const BubbleBadge = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
  color: #cafff2;
  background: rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
`

const BubbleBody = styled(Flex)`
  flex-direction: column;
  gap: 6px;
`

const SymbolRow = styled(Flex)`
  align-items: center;
  gap: 8px;
`

const TokenDot = styled.div<{ tone: BubbleTone }>`
  width: var(--bubble-dot);
  height: var(--bubble-dot);
  border-radius: 50%;
  background: ${({ tone }) =>
    tone === 'bull' ? 'rgba(255, 197, 63, 0.9)' : tone === 'bear' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255,255,255,0.6)'};
  display: grid;
  place-items: center;
  font-weight: 700;
  color: ${({ tone }) => (tone === 'bear' ? '#fff' : '#0b1e17')};
`

const ChangeText = styled(Text)<{ tone: BubbleTone }>`
  color: ${({ tone }) => (tone === 'bear' ? '#ff7c9b' : tone === 'neutral' ? '#e6e6e6' : '#8df6d6')};
`

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash >>> 0
}

const mulberry32 = (seed: number) => {
  let t = seed + 0x6d2b79f5
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
