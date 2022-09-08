import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { rgba } from 'polished'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Edit2, XCircle } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import { AutoRow } from '../Row'

const BaseWrapper = styled.div`
  padding: 6px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;

  &[data-selected='true'] {
    background-color: ${({ theme }) => rgba(theme.primary, 0.15)};
  }
  @media (hover: hover) {
    :hover {
      background-color: ${({ theme }) => theme.buttonBlack};
      > .close-btn {
        display: block;
      }
    }
  }
`

const CloseBtn = styled(XCircle)<{ forceShow: boolean }>`
  position: absolute;
  display: none;
  right: -5px;
  top: -5px;
  color: ${({ theme }) => theme.subText};
  display: ${({ forceShow }) => (forceShow ? 'block' : 'none')};
`

export default function CommonBases({
  chainId,
  onSelect,
  selectedCurrency,
  tokens = [],
  handleClickFavorite,
}: {
  chainId?: ChainId
  selectedCurrency?: Currency | null
  tokens: Currency[]
  onSelect: (currency: Currency) => void
  handleClickFavorite: (e: React.MouseEvent, currency: Currency) => void
}) {
  const theme = useTheme()
  const [isEditMode, setEditMode] = useState(false)
  if (!tokens.length) return null
  return (
    <AutoColumn gap="md">
      <AutoRow gap="4px">
        {(tokens as Token[]).map((token: Token) => {
          const selected = selectedCurrency instanceof Token && selectedCurrency.address === token.address
          const showWToken: Currency = token
          return (
            <BaseWrapper onClick={() => !selected && onSelect(showWToken)} data-selected={selected} key={token.address}>
              <CurrencyLogo currency={showWToken} style={{ marginRight: 8 }} />
              <Text fontWeight={500} fontSize={16}>
                {showWToken.symbol}
              </Text>
              <CloseBtn
                forceShow={isEditMode}
                className="close-btn"
                size={16}
                onClick={e => handleClickFavorite(e, token)}
              />
            </BaseWrapper>
          )
        })}
        {isMobile && (
          <BaseWrapper
            style={{ padding: 10, width: 40 }}
            onClick={() => {
              setEditMode(prev => !prev)
            }}
          >
            <Edit2 size={16} color={theme.subText} />
          </BaseWrapper>
        )}
      </AutoRow>
    </AutoColumn>
  )
}
