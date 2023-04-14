import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { ArrowDown, ArrowUp, Info } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as QuestionSquareIcon } from 'assets/svg/question_icon_square.svg'
import { ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { ConnectWalletButton } from 'components/YieldPools/ElasticFarmGroup/buttons'
import { FarmList } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { ClickableText, ElasticFarmV2TableHeader } from 'components/YieldPools/styleds'
import { NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { Dots } from 'pages/Pool/styleds'
import { useWalletModalToggle } from 'state/application/hooks'
import { SORT_DIRECTION, SORT_FIELD, useFarmV2Action, useFilteredFarmsV2 } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2 } from 'state/farms/elasticv2/types'
import { useSingleCallResult } from 'state/multicall/hooks'
import useGetElasticPools from 'state/prommPools/useGetElasticPools'
import { useIsTransactionPending } from 'state/transactions/hooks'
import { useViewMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'

import FarmCard from './components/FarmCard'
import { ListView } from './components/ListView'
import StakeWithNFTsModal from './components/StakeWithNFTsModal'
import UnstakeWithNFTsModal from './components/UnstakeWithNFTsModal'
import UpdateLiquidityModal from './components/UpdateLiquidityModal'

const Wrapper = styled.div`
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 1rem;
    margin-left: -1rem;
    margin-right: -1rem;
    border: none;
    border-radius: 0;
  `}
`

export default function ElasticFarmv2({ onShowStepGuide }: { onShowStepGuide: () => void }) {
  const theme = useTheme()
  const { chainId, account } = useActiveWeb3React()
  const farmAddress = (NETWORKS_INFO[chainId] as EVMNetworkInfo).elastic?.farmV2Contract
  const above1000 = useMedia('(min-width: 1000px)')

  const [searchParams, setSearchParams] = useSearchParams()

  const sortField = searchParams.get('orderBy') || SORT_FIELD.MY_DEPOSIT
  const sortDirection = searchParams.get('orderDirection') || SORT_DIRECTION.DESC

  const { filteredFarms, farms } = useFilteredFarmsV2()

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

  const toggleWalletModal = useWalletModalToggle()
  const renderApproveButton = () => {
    if (!account) {
      return <ConnectWalletButton onClick={toggleWalletModal} />
    }
    if (res?.loading) return <Dots />

    if (isApprovedForAll) {
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

  const [viewMode] = useViewMode()

  const handleSort = (field: SORT_FIELD) => {
    const direction =
      sortField !== field
        ? SORT_DIRECTION.DESC
        : sortDirection === SORT_DIRECTION.DESC
        ? SORT_DIRECTION.ASC
        : SORT_DIRECTION.DESC

    searchParams.set('orderDirection', direction)
    searchParams.set('orderBy', field)
    setSearchParams(searchParams)
  }

  const renderTableHeaderOnDesktop = () => {
    return (
      <ElasticFarmV2TableHeader>
        <Flex alignItems="center" justifyContent="flex-start">
          <ClickableText>
            <Trans>Pool</Trans>
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flex-start">
          <ClickableText>
            <Trans>Active Range</Trans>
          </ClickableText>
          <InfoHelper text="" />
        </Flex>

        <Flex alignItems="center" justifyContent="flex-start">
          <ClickableText
            onClick={() => {
              handleSort(SORT_FIELD.STAKED_TVL)
            }}
          >
            <Trans>Staked TVL</Trans>
            {sortField === SORT_FIELD.STAKED_TVL &&
              (sortDirection === SORT_DIRECTION.DESC ? (
                <ArrowDown size={12} />
              ) : sortDirection === SORT_DIRECTION.ASC ? (
                <ArrowUp size={12} />
              ) : null)}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flex-start">
          <ClickableText
            onClick={() => {
              handleSort(SORT_FIELD.APR)
            }}
          >
            <Trans>AVG APR</Trans>

            {sortField === SORT_FIELD.APR &&
              (sortDirection === SORT_DIRECTION.DESC ? (
                <ArrowDown size={12} />
              ) : sortDirection === SORT_DIRECTION.ASC ? (
                <ArrowUp size={12} />
              ) : null)}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText
            onClick={() => {
              handleSort(SORT_FIELD.END_TIME)
            }}
          >
            <Trans>Ending In</Trans>
            {sortField === SORT_FIELD.END_TIME &&
              (sortDirection === SORT_DIRECTION.DESC ? (
                <ArrowDown size={12} />
              ) : sortDirection === SORT_DIRECTION.ASC ? (
                <ArrowUp size={12} />
              ) : null)}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText
            onClick={() => {
              handleSort(SORT_FIELD.MY_DEPOSIT)
            }}
          >
            <Trans>My Deposit</Trans>
            {sortField === SORT_FIELD.MY_DEPOSIT &&
              (sortDirection === SORT_DIRECTION.DESC ? (
                <ArrowDown size={12} />
              ) : sortDirection === SORT_DIRECTION.ASC ? (
                <ArrowUp size={12} />
              ) : null)}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText
            onClick={() => {
              handleSort(SORT_FIELD.MY_REWARD)
            }}
          >
            <Trans>My Rewards</Trans>
            {sortField === SORT_FIELD.MY_REWARD &&
              (sortDirection === SORT_DIRECTION.DESC ? (
                <ArrowDown size={12} />
              ) : sortDirection === SORT_DIRECTION.ASC ? (
                <ArrowUp size={12} />
              ) : null)}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>Actions</Trans>
          </ClickableText>
        </Flex>
      </ElasticFarmV2TableHeader>
    )
  }

  const [selectedFarm, setSelectedFarm] = useState<null | ElasticFarmV2>(null)
  const [selectedUnstakeFarm, setSelectedUnstakeFarm] = useState<null | ElasticFarmV2>(null)
  const [selectedUpdateFarm, setSelectedUpdateFarm] = useState<null | ElasticFarmV2>(null)

  if (!filteredFarms?.length) return null

  const listMode = above1000 && viewMode === VIEW_MODE.LIST
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
      <FarmList gridMode={viewMode === VIEW_MODE.GRID || !above1000} style={{ margin: '0' }}>
        {listMode && renderTableHeaderOnDesktop()}

        {filteredFarms?.map(farm =>
          listMode ? (
            <ListView
              key={farm.id}
              farm={farm}
              poolAPR={poolDatas?.[farm.poolAddress].apr || 0}
              isApproved={isApprovedForAll}
            />
          ) : (
            <FarmCard
              key={farm.id}
              farm={farm}
              onStake={() => setSelectedFarm(farm)}
              onUnstake={() => setSelectedUnstakeFarm(farm)}
              onUpdateFarmClick={() => setSelectedUpdateFarm(farm)}
              poolAPR={poolDatas?.[farm.poolAddress].apr || 0}
              isApproved={isApprovedForAll}
            />
          ),
        )}
      </FarmList>

      {!!selectedFarm && (
        <StakeWithNFTsModal farm={selectedFarm} isOpen={!!selectedFarm} onDismiss={() => setSelectedFarm(null)} />
      )}
      {!!selectedUnstakeFarm && (
        <UnstakeWithNFTsModal
          farm={selectedUnstakeFarm}
          isOpen={!!selectedUnstakeFarm}
          onDismiss={() => setSelectedUnstakeFarm(null)}
        />
      )}
      {!!selectedUpdateFarm && (
        <UpdateLiquidityModal
          farm={selectedUpdateFarm}
          isOpen={!!selectedUpdateFarm}
          onDismiss={() => setSelectedUpdateFarm(null)}
        />
      )}
    </Wrapper>
  )
}
