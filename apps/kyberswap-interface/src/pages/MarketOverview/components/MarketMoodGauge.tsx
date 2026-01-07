import { rgba } from 'polished'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

type MarketMoodGaugeProps = {
  value?: number
  size?: number
  leftLabel?: string
  rightLabel?: string
}

const totalSegments = 48
const segmentsPerQuadrant = 20

export default function MarketMoodGauge({
  value,
  size = 320,
  leftLabel = 'Bearish',
  rightLabel = 'Bullish',
}: MarketMoodGaugeProps) {
  const theme = useTheme()

  const segmentAngle = 90 / segmentsPerQuadrant
  const sweepAngle = segmentAngle * totalSegments
  const segmentStep = sweepAngle / (totalSegments - 1)

  const startAngle = -sweepAngle / 2
  const endAngle = sweepAngle / 2
  const startLabelPos = polarToOffset(startAngle, size)
  const endLabelPos = polarToOffset(endAngle, size)

  const [needleAngle, setNeedleAngle] = useState(startAngle)
  const [highlightAngle, setHighlightAngle] = useState(startAngle)
  const needleAngleRef = useRef(startAngle)
  const highlightAngleRef = useRef(startAngle)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const normalizedValue = clamp(value ?? 0, 0, 100)
    const targetIndex = Math.round((normalizedValue / 100) * (totalSegments - 1))
    const targetAngle = startAngle + targetIndex * segmentStep
    const fromAngle = needleAngleRef.current
    const currentIndex = Math.round((fromAngle - startAngle) / segmentStep)
    const deltaSegments = Math.abs(targetIndex - currentIndex)
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    const durationMs = clamp(deltaSegments * 40, 200, 1200)
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = Math.min(now - startTime, durationMs)
      const t = elapsed / durationMs
      const nextNeedle = fromAngle + (targetAngle - fromAngle) * t
      needleAngleRef.current = nextNeedle
      setNeedleAngle(nextNeedle)

      const currentHighlight = highlightAngleRef.current
      const diff = nextNeedle - currentHighlight
      const nextHighlight = Math.abs(diff) < 0.1 ? nextNeedle : currentHighlight + diff * 0.12
      highlightAngleRef.current = nextHighlight
      setHighlightAngle(nextHighlight)

      if (t < 1 || Math.abs(nextNeedle - nextHighlight) >= 0.1) {
        animationRef.current = requestAnimationFrame(tick)
      }
    }

    animationRef.current = requestAnimationFrame(tick)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [segmentStep, startAngle, value])

  const rawIndex = (highlightAngle - startAngle) / segmentStep
  const activeIndex = clamp(Math.round(rawIndex), 0, totalSegments - 1)

  const segmentColors = useMemo(() => {
    const denominator = totalSegments - 1
    return Array.from({ length: totalSegments }, (_, index) => {
      const ratio = index / denominator
      const base = rgba('#A9A9A9', 0.35)
      const highlight = rgba('#31CB9E', 0.35 + ratio * 0.55)
      return { base, highlight }
    })
  }, [])

  return (
    <PieWrapper>
      <Gauge size={size}>
        <Segments>
          {segmentColors.map((color, index) => {
            const angle = startAngle + (index / (totalSegments - 1)) * sweepAngle
            const isActive = index === activeIndex
            const isHighlighted = index <= activeIndex
            return (
              <SegmentHolder key={angle} angle={angle}>
                <SegmentBar active={isActive} color={isHighlighted ? color.highlight : color.base} />
              </SegmentHolder>
            )
          })}
        </Segments>
        <Needle angle={needleAngle} />
        <NeedleCenter />
        <LabelLayer>
          <LabelItem style={{ left: startLabelPos.x, top: startLabelPos.y }}>
            <Text fontSize={20} color={theme.subText} fontWeight={700}>
              {leftLabel}
            </Text>
          </LabelItem>
          <LabelItem style={{ left: endLabelPos.x, top: endLabelPos.y }}>
            <Text fontSize={20} color={theme.primary} fontWeight={700}>
              {rightLabel}
            </Text>
          </LabelItem>
        </LabelLayer>
      </Gauge>
    </PieWrapper>
  )
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const polarToOffset = (rotateAngle: number, size: number) => {
  const rad = ((90 - rotateAngle) * Math.PI) / 180
  const radius = size * 0.3
  const centerX = size * 0.5
  const centerY = size * 0.65
  return {
    x: centerX + Math.cos(rad) * radius,
    y: centerY - Math.sin(rad) * radius,
  }
}

const PieWrapper = styled(Flex)`
  flex-direction: column;
  align-items: center;
  gap: 8px;
`

const Gauge = styled.div<{ size: number }>`
  --size: ${({ size }) => `${size}px`};
  --radius: calc(var(--size) * 0.42);
  --segment-width: calc(var(--size) * 0.025);
  --segment-height: calc(var(--size) * 0.065);
  width: var(--size);
  height: calc(var(--size) * 0.58);
  position: relative;
  touch-action: none;
`

const Segments = styled.div`
  position: absolute;
  inset: 0;
`

const SegmentHolder = styled.div<{ angle: number }>`
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 0;
  height: 0;
  transform: rotate(${({ angle }) => angle}deg);
  transform-origin: center bottom;
`

const SegmentBar = styled.div<{ active: boolean; color: string }>`
  width: var(--segment-width);
  height: var(--segment-height);
  border-radius: 999px;
  clip-path: ${({ active }) => (!active ? 'polygon(0% 0%, 100% 0%, calc(100% - 12%) 100%, 12% 100%)' : 'none')};
  background: ${({ theme, active, color }) => (active ? theme.primary : color)};
  transform: translate(-50%, calc(var(--radius) * -1))
    scale(${({ active }) => (active ? 1.06 : 1)}, ${({ active }) => (active ? 1.4 : 1)});
  box-shadow: ${({ theme, active }) => (active ? `0 0 10px ${theme.primary}` : 'none')};
  transition: transform 0.5s ease, box-shadow 0.2s ease;
`

const Needle = styled.div<{ angle: number }>`
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 12px;
  height: calc(var(--radius) * 0.8);
  background: linear-gradient(180deg, #39e6b5 0%, #1aa37e 100%);
  clip-path: polygon(50% 8%, 100% 100%, 0% 100%);
  transform-origin: center bottom;
  transform: translateX(-50%) rotate(${({ angle }) => angle}deg);
  transition: transform 0.8s cubic-bezier(0.22, 0.61, 0.36, 1);
  filter: drop-shadow(0 0 8px rgba(49, 203, 158, 0.45));
`

const NeedleCenter = styled.div`
  position: absolute;
  left: 50%;
  bottom: -9px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, #3fe1b5 0%, #0f5c48 75%);
  box-shadow: 0 0 10px rgba(49, 203, 158, 0.6);
`

const LabelLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

const LabelItem = styled.div`
  position: absolute;
  transform: translate(-50%, 0);
  white-space: nowrap;
`
