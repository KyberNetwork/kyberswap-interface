import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Info } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import { RowBetween, RowFit, RowWrap } from 'components/Row'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { Dots } from 'pages/Pool/styleds'
import { useElasticFarmsV2, useFarmV2Action } from 'state/farms/elasticv2/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import useGetElasticPools from 'state/prommPools/useGetElasticPools'
import { useIsTransactionPending } from 'state/transactions/hooks'

import FarmCard from './components/FarmCard'

const Wrapper = styled.div`
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const FarmsWrapper = styled(RowWrap)`
  --items-in-row: 3;
  --gap: 24px;
`

export default function ElasticFarmv2() {
  const theme = useTheme()
  const { chainId, account } = useActiveWeb3React()
  const farmAddress = (NETWORKS_INFO[chainId] as EVMNetworkInfo).elastic?.farmV2Contract
  const above1000 = useMedia('(min-width: 1000px)')

  const { farms } = useElasticFarmsV2()
  const { approve } = useFarmV2Action()
  const posManager = useProAmmNFTPositionManagerContract()
  const [approvalTx, setApprovalTx] = useState('')
  const isApprovalTxPending = useIsTransactionPending(approvalTx)
  const res = useSingleCallResult(posManager, 'isApprovedForAll', [account, farmAddress])
  const isApprovedForAll = res?.result?.[0] || !farmAddress

  const handleApprove = async () => {
    if (!isApprovedForAll) {
      const tx = await approve()
      setApprovalTx(tx)
    }
  }

  const { data: poolDatas } = useGetElasticPools(farms?.map(f => f.poolAddress) || [])

  const [searchParams] = useSearchParams()
  const tab = searchParams.get('type') || 'active'

  const renderApproveButton = () => {
    if (isApprovedForAll || tab === 'ended') {
      return null
    }

    if (approvalTx && isApprovalTxPending) {
      return (
        <ButtonPrimary
          style={{
            whiteSpace: 'nowrap',
            height: '38px',
            padding: '0 12px',
          }}
          onClick={handleApprove}
          disabled
        >
          <Info width="16px" />
          <Text fontSize="14px" marginLeft="8px">
            <Dots>
              <Trans>Approving</Trans>
            </Dots>
          </Text>
        </ButtonPrimary>
      )
    }

    return (
      <MouseoverTooltipDesktopOnly
        text={
          <Text color={theme.subText} as="span">
            <Trans>
              Authorize the farming contract so it can access your liquidity positions (i.e. your NFT tokens). Then
              deposit your liquidity positions using the{' '}
              <Text as="span" color={theme.text}>
                Deposit
              </Text>{' '}
              button
            </Trans>
          </Text>
        }
        width="400px"
        placement="top"
      >
        <ButtonPrimary
          style={{
            whiteSpace: 'nowrap',
            height: '38px',
            padding: '0 12px',
          }}
          onClick={handleApprove}
        >
          <Info width="16px" />
          <Text fontSize="14px" marginLeft="8px">
            {approvalTx && isApprovalTxPending ? (
              <Dots>
                <Trans>Approving</Trans>
              </Dots>
            ) : above1000 ? (
              <Trans>Approve Farming Contract</Trans>
            ) : (
              <Trans>Approve</Trans>
            )}
          </Text>
        </ButtonPrimary>
      </MouseoverTooltipDesktopOnly>
    )
  }

  if (!farms) return null

  return (
    <Wrapper>
      <RowBetween>
        <Text fontSize="16px" lineHeight="20px" color={theme.text}>
          <Trans>Elastic Farm V2</Trans>
        </Text>
        <RowFit>{renderApproveButton()}</RowFit>
      </RowBetween>
      <Divider />
      <FarmsWrapper>
        {farms?.map(farm => (
          <FarmCard key={farm.id} farm={farm} poolAPR={poolDatas?.[farm.poolAddress].apr || 0} />
        ))}
      </FarmsWrapper>
    </Wrapper>
  )
}
