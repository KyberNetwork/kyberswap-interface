import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { ExternalLink } from 'theme'
import { formatBigLiquidity } from 'utils/formatBalance'
import Loader from 'components/Loader'
import { useGlobalData } from 'state/about/hooks'
import { useMedia } from 'react-use'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { VERSION } from 'constants/v2'

const Wrapper = styled.div`
  gap: 12px;
  display: flex;

  @media only screen and (max-width: 880px) {
    display: none;
  }
`
export const GlobalData = () => {
  const data = useGlobalData()

  const globalData = data && data.dmmFactories[0]
  const aggregatorData = data?.aggregatorData

  return (
    <Wrapper>
      <GlobalDataItem>
        <GlobalDataItemTitle>
          <Trans>Total Trading Volume:</Trans>&nbsp;
        </GlobalDataItemTitle>
        <GlobalDataItemValue>
          {aggregatorData?.totalVolume ? formatBigLiquidity(aggregatorData.totalVolume, 2, true) : <Loader />}
        </GlobalDataItemValue>
      </GlobalDataItem>
      <GlobalDataItem>
        <GlobalDataItemTitle>
          <Trans>Total Value Locked:</Trans>&nbsp;
        </GlobalDataItemTitle>
        <GlobalDataItemValue>
          {globalData ? formatBigLiquidity(globalData.totalLiquidityUSD, 2, true) : <Loader />}
        </GlobalDataItemValue>
      </GlobalDataItem>
    </Wrapper>
  )
}

export const Instruction = () => {
  const qs = useParsedQueryString()
  const tab = (qs.tab as string) || VERSION.CLASSIC

  const below1412 = useMedia('(max-width: 1412px)')
  const above1000 = useMedia('(min-width: 1001px)')

  return (
    <InstructionItem>
      {tab === VERSION.ELASTIC ? (
        <Trans>
          Add liquidity to our Elastic Pools & earn fees automatically. {below1412 && above1000 ? <br /> : ''}Provide
          liquidity in any price range & earn more with concentrated liquidity. Your fee earnings will also be
          compounded!
        </Trans>
      ) : (
        <Trans>
          Add liquidity to our Classic Pools & earn fees automatically. We amplify liquidity pools so you earn more fees
          even with less liquidity!
        </Trans>
      )}
      &nbsp;
      <ExternalLink
        href={
          tab === VERSION.ELASTIC
            ? 'https://docs.kyberswap.com/guides/creating-a-pool'
            : 'https://docs.kyberswap.com/classic/guides/basic-pool-creation'
        }
      >
        <Trans>Learn More ↗</Trans>
      </ExternalLink>
    </InstructionItem>
  )
}

const GlobalDataItem = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.background};
  padding: 6px 12px;
  border-radius: 999px;
`

const GlobalDataItemTitle = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

const GlobalDataItemValue = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const InstructionItem = styled.div`
  padding: 1rem 0;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  line-height: 1.5;
  border-top: 1px solid ${({ theme }) => theme.border};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`
