import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { useState } from 'react'
import { Repeat, X } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DropdownIcon from 'components/Icons/DropdownIcon'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'
import KyberScoreMeter from 'pages/TrueSightV2/components/KyberScoreMeter'

const Wrapper = styled.div`
  width: 100%;
  border-radius: 20px;
  padding: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
`

const TokenTab = styled(RowFit)<{ active?: boolean }>`
  padding: 8px 12px;
  gap: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  border-radius: 20px;
  font-size: 14px;
  line-height: 18px;
  :hover {
    filter: brightness(0.9);
  }
  :active {
    filter: brightness(1.2);
  }

  ${({ active, theme }) =>
    active
      ? css`
          background-color: ${theme.primary + '30'};
          color: ${theme.primary};
        `
      : css`
          border-color: ${theme.border};
          color: ${theme.subText};
        `}
`

const ButtonX = styled.div`
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  :hover {
    filter: brightness(0.9);
  }
  :active {
    filter: brightness(1.2);
  }
`

const PriceTag = styled(RowFit)<{ down?: boolean }>`
  padding: 4px 6px;
  border-radius: 12px;
  white-space: nowrap;
  font-size: 12px;
  line-height: 16px;
  ${({ down, theme }) =>
    down
      ? css`
          color: ${theme.red};
          background-color: ${theme.red + '30'};
        `
      : css`
          color: ${theme.primary};
          background-color: ${theme.primary + '30'};
        `}
`

const enum TokenTabType {
  First,
  Second,
}

const TruesightPoolModal = ({
  currency0,
  currency1,
  onDismiss,
}: {
  currency0?: Currency
  currency1?: Currency
  onDismiss: () => void
}) => {
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(true)
  const [tab, setTab] = useState<TokenTabType>(TokenTabType.First)
  const handleDismiss = () => {
    setIsOpen(false)
    const timeout = setTimeout(() => {
      onDismiss()
      clearTimeout(timeout)
    }, 300)
  }
  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss}>
      <Wrapper>
        <RowBetween marginBottom="20px">
          <RowFit gap="8px">
            <TokenTab active={tab === TokenTabType.First} onClick={() => setTab(TokenTabType.First)}>
              <CurrencyLogo currency={currency0} size="16px" />
              {currency0?.symbol}
            </TokenTab>
            <TokenTab active={tab === TokenTabType.Second} onClick={() => setTab(TokenTabType.Second)}>
              <CurrencyLogo currency={currency1} size="16px" />
              {currency1?.symbol}
            </TokenTab>
          </RowFit>
          <ButtonX onClick={handleDismiss}>
            <X />
          </ButtonX>
        </RowBetween>
        <RowBetween marginBottom="20px">
          <RowFit gap="4px">
            <Text fontSize="24px" lineHeight="28px">
              $22,841.05
            </Text>
            <PriceTag down>
              <DropdownIcon size={16} /> 23.32%
            </PriceTag>
          </RowFit>
          <RowFit>
            <ButtonLight height="24px">
              <RowFit gap="4px">
                <Repeat size={14} />
                Swap
              </RowFit>
            </ButtonLight>
          </RowFit>
        </RowBetween>
        <Row marginBottom="16px">
          <Text fontSize="14px" lineHeight="20px">
            KyberScore
          </Text>
        </Row>
        <Row justify="center" marginBottom="12px">
          <KyberScoreMeter value={75} />
        </Row>
        <Row justify="center" marginBottom="16px">
          <Text fontSize="24px" lineHeight="28px" color={theme.primary}>
            Strong Buy
          </Text>
        </Row>
        <Row justify="center" marginBottom="24px">
          <Text fontSize="14px" lineHeight="20px" color={theme.text} textAlign="center" width="80%">
            $KNC seems to be a <span style={{ color: theme.primary }}>Strong Buy</span> with a KyberScore of{' '}
            <span style={{ color: theme.primary }}>75</span> / 100
          </Text>
        </Row>
        <Row justify="center" marginBottom="12px">
          <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
            <Trans>Want to know more? Explore KNC in Truesight!</Trans>
          </Text>
        </Row>
        <ButtonPrimary height="36px">
          Explore {tab === TokenTabType.First ? currency0?.symbol : currency1?.symbol}
        </ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}

export default React.memo(TruesightPoolModal)
