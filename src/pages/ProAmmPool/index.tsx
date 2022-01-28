import React, { useContext, useMemo, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Text } from 'rebass'
import { t, Trans } from '@lingui/macro'
import { SwapPoolTabs } from 'components/NavigationTabs'
import { DataCard, CardNoise, CardBGImage } from 'components/earn/styled'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import { AutoRow, RowBetween } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import { StyledInternalLink, TYPE, HideSmall } from '../../theme'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'
import { useProAmmPositions } from 'hooks/useProAmmPositions'
import { PositionDetails } from 'types/position'
import PositionListItem from './PositionListItem'

export const PageWrapper = styled(AutoColumn)`
  padding: 16px 0 100px;
  width: 100%;
  max-width: 1008px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
  max-width: 664px;
`}
  ${({ theme }) => theme.mediaWidth.upToSmall`
  padding: 12px 0 100px;
  max-width: 350px;
`};
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const InstructionText = styled.div`
  width: 100%;
  padding: 16px 20px;
  background-color: ${({ theme }) => theme.bg17};
  border-radius: 5px;
  font-size: 14px;
  line-height: 1.5;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
  flex-direction: column-reverse;
`};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const PositionCardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, auto) minmax(320px, auto) minmax(320px, auto);
  gap: 24px;
  max-width: 1008px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
  grid-template-columns: 1fr 1fr;
  max-width: 664px;
`}
  ${({ theme }) => theme.mediaWidth.upToSmall`
  grid-template-columns: 1fr;
  max-width: 350px;
`};
`
export default function ProAmmPool() {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const theme = useContext(ThemeContext)
  const { positions, loading: positionsLoading } = useProAmmPositions(account)
  console.log('====positions', positions)
  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []]
  ) ?? [[], []]

  const filteredPositions = [...openPositions, ...closedPositions]
  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardBGImage />
          <CardNoise />
        </VoteCard>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <AutoRow>
              <InstructionText>
                <Trans>Here you can view all your liquidity positions and add/remove more liquidity.</Trans>
              </InstructionText>
            </AutoRow>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <HideSmall>
                <TYPE.mediumHeader style={{ marginTop: '0.5rem', justifySelf: 'flex-start' }}>
                  <Trans>My Liquidity Pools</Trans>
                </TYPE.mediumHeader>
              </HideSmall>
            </TitleRow>
            {positionsLoading ? (
              <>Loading</>
            ) : filteredPositions && filteredPositions.length > 0 ? (
              <>
                {filteredPositions.map(p => {
                  return <PositionListItem key={p.tokenId.toString()} positionDetails={p} />
                })}
              </>
            ) : (
              <>No liquid</>
            )}
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
