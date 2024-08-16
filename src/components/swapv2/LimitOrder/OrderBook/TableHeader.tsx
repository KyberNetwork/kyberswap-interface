import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'

import { ItemWrapper } from './OrderItem'

const Header = styled(ItemWrapper)`
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  padding: 16px 12px;
  cursor: default;
  /* :hover {
    background-color: ${({ theme }) => rgba(theme.primary, 0.2)};
  } */
`

const DropdownIcon = styled(DropdownSvg)<{ open: boolean }>`
  color: ${({ theme }) => theme.subText};
  transform: rotate(${({ open }) => (open ? '180deg' : '0')});
  transition: transform 300ms;
  min-width: 24px;
`

const TabWrapper = styled.div`
  overflow: hidden;
  transition: 0.3s ease-in-out;
  position: relative;
  left: -14px;
`

const TabContainer = styled.div`
  display: flex;
  background: ${({ theme }) => theme.buttonBlack};
  border: ${({ theme }) => `1px solid ${theme.border}`};
  width: fit-content;
  border-radius: 999px;
  padding: 1px;
  margin-top: 12px;
`

const TabItem = styled(Flex)<{ active?: boolean }>`
  padding: 4px 8px;
  align-items: center;
  border-radius: 999px;
  background: ${({ theme, active }) => (active ? theme.tabActive : 'transparent')};
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  transition: 0.2s ease-in-out;
`

export default function TableHeader({
  showAmountOut,
  setShowAmountOut,
}: {
  showAmountOut: boolean
  setShowAmountOut: (value: boolean) => void
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { currencyIn, currencyOut } = useLimitState()
  const [openDropdown, setOpenDropdown] = useState<boolean>(false)

  const onClickDropdown = () => setOpenDropdown(!openDropdown)
  const onChangeDisplayedAmount = () => setShowAmountOut(!showAmountOut)

  return (
    <Header>
      <Text>CHAIN</Text>
      <Text>
        <Trans>RATE</Trans>
        {upToSmall ? <br /> : ' '}(<span>{currencyIn?.symbol}/</span>
        <span>{currencyOut?.symbol}</span>)
      </Text>
      {!upToSmall && (
        <Text>
          <Trans>AMOUNT</Trans>
          {upToSmall ? <br /> : ' '}
          <span>({currencyIn?.symbol})</span>
        </Text>
      )}
      <div>
        <Flex>
          <Text>
            <Trans>AMOUNT</Trans>
            {upToSmall ? <br /> : ' '}
            <span>({!upToSmall || showAmountOut ? currencyOut?.symbol : currencyIn?.symbol})</span>
          </Text>
          {upToSmall && <DropdownIcon open={openDropdown} onClick={onClickDropdown} />}
        </Flex>
        {upToSmall && (
          <TabWrapper style={{ height: openDropdown ? 40 : 0 }}>
            <TabContainer>
              <TabItem active={!showAmountOut} onClick={onChangeDisplayedAmount}>
                {currencyIn?.symbol}
              </TabItem>
              <TabItem active={showAmountOut} onClick={onChangeDisplayedAmount}>
                {currencyOut?.symbol}
              </TabItem>{' '}
            </TabContainer>
          </TabWrapper>
        )}
      </div>
      <Text>
        <Trans>ORDER STATUS</Trans>
      </Text>
    </Header>
  )
}
