import styled from 'styled-components'
import { Flex } from 'rebass'
import { MoreHorizontal } from 'react-feather'

export const ListItemGroupContainer = styled.div`
  border-bottom: ${({ theme }) => `1px solid ${theme.bg14}`};
`

export const TableRow = styled.div<{ active?: boolean; isShowBorderBottom?: boolean }>`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 1.5fr 1.5fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr;
  padding: 24px 16px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  background-color: ${({ theme, active }) => (active ? theme.evenRow : theme.oddRow)};
  position: relative;
  cursor: pointer;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 86.36%; // 100% - (1.5fr / grid-template-columns)
    border-bottom: ${({ theme, isShowBorderBottom }) => (isShowBorderBottom ? `1px dashed ${theme.bg14}` : 'none')};
  }
`

export const StyledItemCard = styled.div`
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

export const GridItem = styled.div<{ noBorder?: boolean }>`
  margin-top: 8px;
  margin-bottom: 8px;
  border-bottom: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px dashed ${theme.border}`)};
  padding-bottom: 12px;
`

export const TradeButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  grid-column: 1 / span 3;
`

export const TradeButtonText = styled.span`
  font-size: 14px;
`

export const DataTitle = styled.div`
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

export const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text7};
  flex-direction: column;
`

export const ButtonWrapper = styled(Flex)`
  justify-content: flex-end;
  gap: 4px;
`

export const StyledMoreHorizontal = styled(MoreHorizontal)`
  color: ${({ theme }) => theme.text9};
`

export const PoolAddressContainer = styled(Flex)`
  align-items: center;
`

export const APR = styled(DataText)`
  color: ${({ theme }) => theme.apr};
`

export const AddressAndAMPContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const AddressWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: baseline;
`

export const TextAMP = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

export const TokenPairContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const TextTokenPair = styled.div``

export const TextAMPLiquidity = styled.div``

export const AMPLiquidityAndTVLContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const TextTVL = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`
