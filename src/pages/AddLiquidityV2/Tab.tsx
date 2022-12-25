import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { TrendingUp, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { RowBetween } from 'components/Row'

const borderLeft = css`
  position: relative;
  ::before {
    content: '';
    position: absolute;
    left: 0px;
    top: 4px;
    height: calc(100% - 7px);
    border-left: 1px solid ${({ theme }) => theme.border};
  }
`

const borderRight = css`
  position: relative;
  ::after {
    content: '';
    position: absolute;
    right: 0px;
    top: 4px;
    height: calc(100% - 7px);
    border-right: 1px solid ${({ theme }) => theme.border};
  }
`

const ScrollBtn = styled.button<{ position: 'left' | 'right'; show: boolean }>`
  cursor: pointer;
  border: none;
  ${({ position, theme }) =>
    position === 'left'
      ? css`
          left: 0;
          ${borderRight}
          filter: drop-shadow(20px 0px 5px ${rgba(theme.buttonBlack, 0.6)});
        `
      : css`
          right: 0;
          ${borderLeft}
          ${borderRight}
          filter: drop-shadow(-20px 0px 5px ${rgba(theme.buttonBlack, 0.6)});
        `}
  position: absolute;
  width: 40px;
  height: 100%;
  background-color: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.text};
  display: ${({ show }) => (show ? 'initial' : 'none')};
  z-index: 1;
  :focus {
    outline: 0;
  }
`

const AddTab = styled.button`
  padding: 8px 12px;
  height: 100%;
  border: none;
  background-color: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.text};
  :focus {
    outline: 0;
  }
  display: flex;
  align-items: center;
  cursor: pointer;
`

const ChartButton = styled(AddTab)`
  min-width: 120px;
  ${borderLeft}
`

const Container = styled(RowBetween)`
  width: 100%;
  height: 32px;
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px 20px 0 0;
  box-sizing: content-box;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  overflow: hidden;
`

const ScrollBar = styled(Flex)`
  position: relative;
`
const TabSlide = styled(Flex)`
  flex-direction: row;
  max-width: 712px;
  overflow-x: scroll;
`

const TabContainer = styled(RowBetween)<{ active: boolean; noBorder?: boolean }>`
  min-width: 120px;
  width: 120px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  ${({ noBorder, active, theme }) =>
    active
      ? css`
          color: ${theme.primary};
          background-color: ${rgba(theme.primary, 0.3)};
          border-width: 0;
          border-bottom: 2px solid ${({ theme }) => theme.primary};
          padding: 8px 12px 6px;
        `
      : noBorder
      ? ''
      : borderRight}
`

const RemoveTab = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
`

const Tab = ({
  onSelected,
  active,
  index,
  onRemove,
  noBorder,
}: {
  onSelected: () => void
  active: boolean
  index: number
  onRemove: () => void
  noBorder: boolean
}) => {
  const onClickRemove: MouseEventHandler<HTMLSpanElement> = useCallback(
    event => {
      event.stopPropagation()
      onRemove()
    },
    [onRemove],
  )

  return (
    <TabContainer active={active} onClick={onSelected} noBorder={noBorder}>
      <Text fontSize={12}>
        <Trans>Position {index + 1}</Trans>
      </Text>
      <RemoveTab onClick={onClickRemove}>
        <X size={12} />
      </RemoveTab>
    </TabContainer>
  )
}

const Tabs = ({
  tabsCount,
  selectedTab,
  onChangedTab,
  onAddTab,
  onRemoveTab,
  onToggleChart,
}: {
  tabsCount: number
  selectedTab: number
  onChangedTab: (index: number) => void
  onAddTab: () => void
  onRemoveTab: (index: number) => void
  onToggleChart: () => void
}) => {
  const [showScrollLeft, setShowScrollLeft] = useState(false)
  const [showScrollRight, setShowScrollRight] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const scrollLeft = useCallback(() => {
    ref.current?.scrollBy({ left: -150, behavior: 'smooth' })
  }, [])

  const scrollRight = useCallback(() => {
    ref.current?.scrollBy({ left: 150, behavior: 'smooth' })
  }, [])

  const onScroll = useCallback(() => {
    const a: any = ref.current ?? {}
    setShowScrollLeft(a.scrollLeft !== 0)
    setShowScrollRight(a.scrollLeft + a.clientWidth !== a.scrollWidth)
  }, [])

  useEffect(() => {
    onScroll()
  }, [tabsCount, onScroll])

  const tabsCountBeforeRef = useRef(tabsCount)
  useEffect(() => {
    if (tabsCount > tabsCountBeforeRef.current) {
      scrollRight()
      onChangedTab(tabsCount - 1)
    }
    tabsCountBeforeRef.current = tabsCount
  }, [scrollRight, tabsCount, onChangedTab])

  return (
    <Container gap="0">
      <ScrollBar>
        <ScrollBtn onClick={scrollLeft} position="left" show={showScrollLeft}>
          &lt;
        </ScrollBtn>
        <TabSlide ref={ref} onScroll={onScroll}>
          {new Array(tabsCount).fill(0).map((_, index) => {
            return (
              <Tab
                key={index}
                active={selectedTab === index}
                index={index}
                onSelected={() => onChangedTab(index)}
                onRemove={() => {
                  if (tabsCount > 1) {
                    if (selectedTab >= tabsCount - 1) {
                      onChangedTab(tabsCount - 2)
                    }
                    onRemoveTab(index)
                  }
                }}
                noBorder={selectedTab === index + 1}
              />
            )
          })}
          <AddTab onClick={() => onAddTab()}>+</AddTab>
        </TabSlide>

        <ScrollBtn onClick={scrollRight} position="right" show={showScrollRight}>
          &gt;
        </ScrollBtn>
      </ScrollBar>
      <ChartButton onClick={onToggleChart}>
        <TrendingUp size={14} />
        &nbsp;Price chart
      </ChartButton>
    </Container>
  )
}

export default Tabs
