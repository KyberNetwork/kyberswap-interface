import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { ExternalLink } from 'theme'
import { formatBigLiquidity } from 'utils/formatBalance'
import Loader from 'components/Loader'
import { useGlobalData } from 'state/about/hooks'

const InstructionAndGlobalData = () => {
  const data = useGlobalData()

  const globalData = data && data.dmmFactories[0]
  const aggregatorData = data?.aggregatorData

  return (
    <InstructionAndGlobalDataContainer>
      <InstructionItem>
        <InstructionText>
          <Trans>Add liquidity and earn fees.</Trans>&nbsp;
        </InstructionText>
        <ExternalLink href="https://docs.kyberswap.com/guides/adding-liquidity/index.html" style={{ fontSize: '14px' }}>
          <Trans>Learn More ↗</Trans>
        </ExternalLink>
      </InstructionItem>
      <GlobalDataItem>
        <GlobalDataItemBaseLine>
          <GlobalDataItemTitle>
            <Trans>Total Trading Volume:</Trans>&nbsp;
          </GlobalDataItemTitle>
          <GlobalDataItemValue>
            {aggregatorData?.totalVolume ? formatBigLiquidity(aggregatorData.totalVolume, 2, true) : <Loader />}
          </GlobalDataItemValue>
        </GlobalDataItemBaseLine>
      </GlobalDataItem>
      <GlobalDataItem>
        <GlobalDataItemBaseLine>
          <GlobalDataItemTitle>
            <Trans>Total Value Locked:</Trans>&nbsp;
          </GlobalDataItemTitle>
          <GlobalDataItemValue>
            {globalData ? formatBigLiquidity(globalData.totalLiquidityUSD, 2, true) : <Loader />}
          </GlobalDataItemValue>
        </GlobalDataItemBaseLine>
      </GlobalDataItem>
    </InstructionAndGlobalDataContainer>
  )
}

export default InstructionAndGlobalData

const InstructionAndGlobalDataContainer = styled.div`
  display: grid;
  grid-gap: 24px;
  grid-template-columns: 1fr auto auto;
  margin-bottom: 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr;
    grid-gap: 16px;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr;
  `};
`

const GlobalDataItem = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 50px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.background};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 8px;
  `};
`

const GlobalDataItemBaseLine = styled.div`
  display: flex;
  align-items: baseline;
  margin-top: -2px;
`

const GlobalDataItemTitle = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.text7};
`

const GlobalDataItemValue = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.primary};
`

const InstructionItem = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.bg17};
  border-radius: 5px;
  text-align: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-column: 1 / span 2;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-column: revert;
  `};
`

const InstructionText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.text};
`