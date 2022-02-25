import React, { useState } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'
import Modal from 'components/Modal'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { Currency } from '@dynamic-amm/sdk'
import CurrencyLogo from 'components/CurrencyLogo'
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'

const TokensSelectWrapper = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 4px;
  padding: 10px;
  font-weight: 500;
  font-size: 15px;
  color: ${({ theme }) => theme.text};
  text-align: left;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 40px;
`

export default function TokensSelect({
  onClick,
  currency,
  onCurrencySelect,
  ...rest
}: {
  onClick?: () => void
  currency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  style?: React.CSSProperties
}) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <TokensSelectWrapper {...rest} onClick={() => setModalOpen(true)}>
      {currency ? (
        <>
          <CurrencyLogo currency={currency || undefined} size={'20px'} style={{ marginRight: '8px' }} />
          {currency.symbol}
        </>
      ) : (
        <Text fontSize={15}>
          <Trans>Select a token</Trans>
        </Text>
      )}
      <ChevronDown size={20} style={{ top: '10px', right: '5px', position: 'absolute' }} />
      <Modal isOpen={modalOpen} onDismiss={() => setModalOpen(false)}>
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={() => setModalOpen(false)}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
        />
      </Modal>
    </TokensSelectWrapper>
  )
}
