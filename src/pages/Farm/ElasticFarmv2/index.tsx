import { Trans } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Info } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as QuestionSquareIcon } from 'assets/svg/question_icon_square.svg'
import { ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import { RowBetween, RowFit, RowWrap } from 'components/Row'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { FARM_TAB } from 'constants/index'
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
import { isAddressString } from 'utils'

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

export default function ElasticFarmv2({ onShowStepGuide }: { onShowStepGuide: () => void }) {
  const theme = useTheme()
  const { isEVM, chainId, account } = useActiveWeb3React()
  const farmAddress = (NETWORKS_INFO[chainId] as EVMNetworkInfo).elastic?.farmV2Contract
  const above1000 = useMedia('(min-width: 1000px)')

  const [searchParams] = useSearchParams()
  const { farms } = useElasticFarmsV2()

  const type = searchParams.get('type')
  const activeTab: string = type || FARM_TAB.ACTIVE
  // const stakedOnlyKey = activeTab === FARM_TAB.ACTIVE ? 'active' : 'ended'
  const search: string = searchParams.get('search')?.toLowerCase() || ''
  const filteredToken0Id = searchParams.get('token0') || undefined
  const filteredToken1Id = searchParams.get('token1') || undefined

  const filteredFarms = useMemo(() => {
    const now = Date.now() / 1000

    // Filter Active/Ended farms
    let result = farms?.filter(farm =>
      activeTab === FARM_TAB.MY_FARMS ? true : activeTab === FARM_TAB.ACTIVE ? farm.endTime >= now : farm.endTime < now,
    )

    // Filter by search value
    const searchAddress = isAddressString(chainId, search)
    if (searchAddress) {
      if (isEVM)
        result = result?.filter(farm => {
          return [farm.poolAddress, farm.token0.address, farm.token1.address].includes(searchAddress)
        })
    } else {
      result = result?.filter(farm => {
        return (
          farm.token0.symbol?.toLowerCase().includes(search) ||
          farm.token1.symbol?.toLowerCase().includes(search) ||
          farm.token0.name?.toLowerCase().includes(search) ||
          farm.token1.name?.toLowerCase().includes(search)
        )
      })
    }

    // Filter by input output token
    if (filteredToken0Id || filteredToken1Id) {
      if (filteredToken1Id && filteredToken0Id) {
        result = result?.filter(farm => {
          return (
            (farm.token0.address.toLowerCase() === filteredToken0Id.toLowerCase() &&
              farm.token1.address.toLowerCase() === filteredToken1Id.toLowerCase()) ||
            (farm.token0.address.toLowerCase() === filteredToken1Id.toLowerCase() &&
              farm.token1.address.toLowerCase() === filteredToken0Id.toLowerCase())
          )
        })
      } else {
        const address = filteredToken1Id || filteredToken0Id
        result = result?.filter(farm => {
          return (
            farm.token0.address.toLowerCase() === address?.toLowerCase() ||
            farm.token1.address.toLowerCase() === address?.toLowerCase()
          )
        })
      }
    }
    return result
  }, [farms, activeTab, chainId, filteredToken0Id, filteredToken1Id, isEVM, search])

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

  if (!filteredFarms?.length) return null

  return (
    <Wrapper>
      <RowBetween>
        <Flex fontSize="16px" alignItems="center" color={theme.text} sx={{ gap: '6px' }}>
          <Trans>Elastic Farm V2</Trans>

          <Text
            color={theme.subText}
            display="flex"
            alignItems="center"
            role="button"
            sx={{ cursor: 'pointer' }}
            onClick={onShowStepGuide}
          >
            <QuestionSquareIcon />
          </Text>
        </Flex>
        <RowFit>{renderApproveButton()}</RowFit>
      </RowBetween>
      <Divider />
      <FarmsWrapper>
        {filteredFarms?.map(farm => (
          <FarmCard key={farm.id} farm={farm} poolAPR={poolDatas?.[farm.poolAddress].apr || 0} />
        ))}
      </FarmsWrapper>
    </Wrapper>
  )
}
