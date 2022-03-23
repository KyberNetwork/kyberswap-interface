import React from 'react'
import { Currency } from '@vutien/sdk-core'
import { Field } from 'state/mint/proamm/actions'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import CopyHelper from 'components/Copy'
import { MoreHorizontal, Share2, BarChart2 } from 'react-feather'
import { shortenAddress } from 'utils'
import { FeeAmount } from '@vutien/dmm-v3-sdk'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { currencyId } from 'utils/currencyId'
import { useActiveWeb3React } from 'hooks'
import { ButtonEmpty } from 'components/Button'
import { Link } from 'react-router-dom'
import { rgba } from 'polished'
import { Plus } from 'react-feather'
import useTheme from 'hooks/useTheme'

interface ListItemProps {
  currencies: { [field in Field]?: Currency }
  poolAddress: string
  fee: FeeAmount
  isFirstPoolInGroup: boolean
}

export const TableRow = styled.div<{ isShowExpandedPools?: boolean; isShowBorderBottom?: boolean }>`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 1.5fr 1.5fr 2fr 0.75fr 1fr 1fr 1fr 1.5fr;
  padding: 24px 16px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  background-color: ${({ theme }) => theme.evenRow};
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 86.36%; // 100% - (1.5fr / grid-template-columns)
    border-bottom: ${({ theme, isShowBorderBottom }) => (isShowBorderBottom ? `1px dashed ${theme.border}` : 'none')};
  }
`
const StyledItemCard = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-column-gap: 4px;
  border-radius: 10px;
  margin-bottom: 0;
  padding: 8px 20px 24px 20px;
  background-color: ${({ theme }) => theme.bg6};
  font-size: 12px;

  ${({ theme }) => theme.mediaWidth.upToXL`
    margin-bottom: 20px;
  `}
`

const GridItem = styled.div<{ noBorder?: boolean }>`
  margin-top: 8px;
  margin-bottom: 8px;
  border-bottom: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px dashed ${theme.border}`)};
  padding-bottom: 12px;
`

const TradeButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  grid-column: 1 / span 3;
`

const TradeButtonText = styled.span`
  font-size: 14px;
`

const DataTitle = styled.div`
  display: flex;
  align-items: flex-start;
  color: ${({ theme }) => theme.text6};
  &:hover {
    opacity: 0.6;
  }
  user-select: none;
  text-transform: uppercase;
  margin-bottom: 4px;
`

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text7};
  flex-direction: column;
`
const StyledMoreHorizontal = styled(MoreHorizontal)`
  color: ${({ theme }) => theme.text9};
`

const PoolAddressContainer = styled(Flex)`
  align-items: center;
`

const APR = styled(DataText)`
  color: ${({ theme }) => theme.apr};
`

export const TokenPairContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const ButtonWrapper = styled(Flex)`
  justify-content: flex-end;
  gap: 4px;
  align-items: center;
`

export default function ProAmmPoolListItem({ currencies, poolAddress, fee, isFirstPoolInGroup }: ListItemProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const currency0 = currencies[Field.CURRENCY_A]
  const currency1 = currencies[Field.CURRENCY_B]

  return (
    <TableRow isShowExpandedPools={true} isShowBorderBottom={true}>
      <DataText>
        {isFirstPoolInGroup && (
          <Flex>
            <TokenPairContainer>
              <DoubleCurrencyLogo currency0={currency0} currency1={currency1} />
              <div>
                {currency0?.symbol} - {currency1?.symbol}
              </div>
            </TokenPairContainer>
          </Flex>
        )}
      </DataText>

      <DataText grid-area="pool">
        <PoolAddressContainer>
          <Text color={theme.text}>{shortenAddress(poolAddress, 3)}</Text>
          <CopyHelper toCopy={poolAddress} />
        </PoolAddressContainer>
        <Text color={theme.text3} fontSize={12} marginTop={'8px'}>
          Fee = {fee / 100}%
        </Text>
      </DataText>
      <DataText></DataText>
      <DataText></DataText>
      <DataText></DataText>
      <DataText></DataText>
      <DataText></DataText>
      <ButtonWrapper style={{ marginRight: '-3px' }}>
        <ButtonEmpty
          padding="0"
          as={Link}
          to={`/proamm/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${fee}`}
          style={{
            background: rgba(theme.primary, 0.2),
            minWidth: '28px',
            minHeight: '28px',
            width: '28px',
            height: '28px'
          }}
        >
          <Plus size={16} color={theme.primary} />
        </ButtonEmpty>
        <ButtonEmpty
          padding="0"
          onClick={e => {
            e.stopPropagation()
          }}
          style={{
            background: rgba(theme.buttonBlack, 0.2),
            minWidth: '28px',
            minHeight: '28px',
            width: '28px',
            height: '28px'
          }}
        >
          <Share2 size="14px" color={theme.subText} />
        </ButtonEmpty>
        <ButtonEmpty
          padding="0"
          onClick={e => {
            e.stopPropagation()
          }}
          style={{
            background: rgba(theme.buttonBlack, 0.2),
            minWidth: '28px',
            minHeight: '28px',
            width: '28px',
            height: '28px'
          }}
        >
          <BarChart2 size="14px" color={theme.subText} />
        </ButtonEmpty>
      </ButtonWrapper>
    </TableRow>
  )
}
