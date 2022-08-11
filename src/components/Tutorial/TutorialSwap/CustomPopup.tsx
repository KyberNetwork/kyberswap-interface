import { Trans, t } from '@lingui/macro'
import { CSSProperties, useMemo } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'
import { CardinalOrientation, OrientationCoords, WalktourLogic } from 'walktour'

import { ButtonPrimary } from 'components/Button'
import useTheme from 'hooks/useTheme'

import { StepCustom, TOTAL_STEP } from './constant'

const PopupWrapper = styled.div`
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 20px;
  border-radius: 20px;
  position: relative;
`
type Direction = 'left' | 'right' | 'bottom' | 'top'

const ARROW_SIZE = 16
const BORDER_TRANSPARENT = `${ARROW_SIZE}px solid transparent`

const getStyleArrow = (arrowColor: string, dir: string) =>
  ({
    left: {
      borderTop: BORDER_TRANSPARENT,
      borderRight: arrowColor,
      borderBottom: BORDER_TRANSPARENT,
    },
    right: {
      borderBottom: BORDER_TRANSPARENT,
      borderLeft: arrowColor,
      borderTop: BORDER_TRANSPARENT,
    },
    top: {
      borderLeft: BORDER_TRANSPARENT,
      borderBottom: arrowColor,
      borderRight: BORDER_TRANSPARENT,
    },
    bottom: {
      borderLeft: BORDER_TRANSPARENT,
      borderTop: arrowColor,
      borderRight: BORDER_TRANSPARENT,
    },
  }[dir])

const Arrow = ({
  color,
  tooltipPosition,
  target,
}: {
  tooltipPosition: OrientationCoords
  color: string
  target: string
}) => {
  const targetElement = useMemo(() => {
    return document.querySelector(target)
  }, [target])

  if (!tooltipPosition?.orientation) return null
  const { orientation } = tooltipPosition
  let arrowDir: Direction = 'top'
  let position: CSSProperties = {}

  const paddingV = (targetElement?.clientHeight || 0) / 2 ?? 15
  const paddingH = (targetElement?.clientWidth || 0) / 2 ?? 15
  switch (orientation) {
    case CardinalOrientation.SOUTH:
      position = { display: 'flex', justifyContent: 'center', top: -ARROW_SIZE, left: 0, right: 0 }
      arrowDir = 'top'
      break
    case CardinalOrientation.SOUTHEAST:
      position = { right: paddingH, top: -ARROW_SIZE }
      arrowDir = 'top'
      break
    case CardinalOrientation.SOUTHWEST:
      position = { top: -ARROW_SIZE, left: paddingH }
      arrowDir = 'top'
      break
    case CardinalOrientation.EAST:
      position = { left: -ARROW_SIZE, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }
      arrowDir = 'left'
      break
    case CardinalOrientation.EASTNORTH:
      position = { left: -ARROW_SIZE, top: paddingV }
      arrowDir = 'left'
      break
    case CardinalOrientation.EASTSOUTH:
      position = { left: -ARROW_SIZE, bottom: paddingV }
      arrowDir = 'left'
      break
    case CardinalOrientation.WESTNORTH:
      position = { right: -ARROW_SIZE, top: paddingV }
      arrowDir = 'right'
      break
    case CardinalOrientation.WEST:
      position = { right: -ARROW_SIZE, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }
      arrowDir = 'right'
      break
    case CardinalOrientation.WESTSOUTH:
      position = { right: -ARROW_SIZE, bottom: paddingV }
      arrowDir = 'right'
      break
    case CardinalOrientation.NORTHWEST:
      position = { bottom: -ARROW_SIZE, left: paddingH }
      arrowDir = 'bottom'
      break
    case CardinalOrientation.NORTH:
      position = { display: 'flex', justifyContent: 'center', bottom: -ARROW_SIZE, left: 0, right: 0 }
      arrowDir = 'bottom'
      break
    case CardinalOrientation.NORTHEAST:
      position = { bottom: -ARROW_SIZE, right: paddingH }
      arrowDir = 'bottom'
      break
    case CardinalOrientation.CENTER:
      return null
  }

  return (
    <div
      className="arrow-tooltip"
      style={{
        position: 'absolute',
        ...position,
      }}
    >
      <div style={{ width: 0, height: 0, ...(getStyleArrow(`${ARROW_SIZE}px solid ${color}`, arrowDir) || {}) }}></div>
    </div>
  )
}

export default function CustomPopup(props: WalktourLogic | undefined): JSX.Element {
  const { stepContent, stepIndex, next, prev, close } = props || ({} as WalktourLogic)
  const theme = useTheme()
  const { customFooterRenderer, popupStyle, title } = stepContent as StepCustom
  const isLastStep = stepIndex - 1 === TOTAL_STEP
  return (
    <PopupWrapper style={popupStyle || { width: 400 }}>
      <Arrow
        target={stepContent.selector}
        tooltipPosition={props?.tooltipPosition || ({} as OrientationCoords)}
        color={theme.tableHeader}
      />
      <Flex justifyContent={'space-between'}>
        {title}
        <span>
          <X cursor={'pointer'} onClick={() => close()} />
        </span>
      </Flex>
      <div>{stepContent.description}</div>
      {customFooterRenderer ? (
        customFooterRenderer(props)
      ) : (
        <Flex alignItems="center" justifyContent="flex-end" marginTop={20}>
          {stepIndex > 0 && (
            <Text
              onClick={() => prev()}
              style={{ cursor: 'pointer', color: theme.primary, marginRight: 30, fontSize: 14 }}
            >
              <Trans>Back</Trans>
            </Text>
          )}
          <ButtonPrimary onClick={() => next()} style={{ width: 72, height: 36 }}>
            {isLastStep ? t`Finish` : t`Next`}
          </ButtonPrimary>
        </Flex>
      )}
    </PopupWrapper>
  )
}
