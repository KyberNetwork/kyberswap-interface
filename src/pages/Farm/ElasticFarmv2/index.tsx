import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import mixpanel from 'mixpanel-browser'
import { useState } from 'react'
import { ArrowDown, ArrowUp, Info } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as QuestionSquareIcon } from 'assets/svg/question_icon_square.svg'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import HoverDropdown from 'components/HoverDropdown'
import InfoHelper from 'components/InfoHelper'
import { MouseoverTooltip, MouseoverTooltipDesktopOnly, TextDashed } from 'components/Tooltip'
import { ConnectWalletButton } from 'components/YieldPools/ElasticFarmGroup/buttons'
import { FarmList } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { ClickableText, ElasticFarmV2TableHeader } from 'components/YieldPools/styleds'
import { SORT_DIRECTION } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { Dots } from 'pages/Pool/styleds'
import { useWalletModalToggle } from 'state/application/hooks'
import { SORT_FIELD, useFarmV2Action, useFilteredFarmsV2 } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2 } from 'state/farms/elasticv2/types'
import { useSingleCallResult } from 'state/multicall/hooks'
import useGetElasticPools from 'state/prommPools/useGetElasticPools'
import { useIsTransactionPending } from 'state/transactions/hooks'
import { useViewMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { MEDIA_WIDTHS } from 'theme'
import { formatDollarAmount } from 'utils/numbers'

import FarmCard from './components/FarmCard'
import { ListView } from './components/ListView'
import NewRangesNotiModal from './components/NewRangesNotiModal'
import StakeWithNFTsModal from './components/StakeWithNFTsModal'
import UnstakeWithNFTsModal from './components/UnstakeWithNFTsModal'
import UpdateLiquidityModal from './components/UpdateLiquidityModal'

const Wrapper = styled.div`
  padding: 24px;
  background-color: ${({ theme }) => theme.background};
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

export default function ElasticFarmv2({
  onShowStepGuide,
  farmAddress,
}: {
  onShowStepGuide: () => void
  farmAddress: string
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const above1000 = useMedia('(min-width: 1000px)')
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [searchParams, setSearchParams] = useSearchParams()

  const sortField = searchParams.get('orderBy') || SORT_FIELD.MY_DEPOSIT
  const sortDirection = searchParams.get('orderDirection') || SORT_DIRECTION.DESC

  const { filteredFarms, farms, updatedFarms, userInfo } = useFilteredFarmsV2(farmAddress)
  const depositedUsd =
    userInfo?.reduce((acc, cur) => (cur.farmAddress === farmAddress ? acc + cur.positionUsdValue : acc), 0) || 0

  const rewardUsd =
    userInfo?.reduce((acc, cur) => (cur.farmAddress === farmAddress ? acc + cur.unclaimedRewardsUsd : acc), 0) || 0

  const rewardTokenAmounts: { [address: string]: CurrencyAmount<Currency> } = {}
  userInfo?.forEach(item => {
    item.unclaimedRewards.forEach(rw => {
      const address = rw.currency.isNative ? rw.currency.symbol || 'eth' : rw.currency.wrapped.address
      if (!rewardTokenAmounts[address]) rewardTokenAmounts[address] = rw
      else rewardTokenAmounts[address] = rewardTokenAmounts[address].add(rw)
    })
  })

  const depositedTokenAmounts: { [address: string]: CurrencyAmount<Currency> } = {}
  userInfo?.forEach(item => {
    const address0 = item.position.amount0.currency.wrapped.address
    const address1 = item.position.amount1.currency.wrapped.address
    if (!depositedTokenAmounts[address0]) depositedTokenAmounts[address0] = item.position.amount0
    else depositedTokenAmounts[address0] = depositedTokenAmounts[address0].add(item.position.amount0)

    if (!depositedTokenAmounts[address1]) depositedTokenAmounts[address1] = item.position.amount1
    else depositedTokenAmounts[address1] = depositedTokenAmounts[address1].add(item.position.amount1)
  })

  const { approve } = useFarmV2Action(farmAddress)
  const posManager = useProAmmNFTPositionManagerContract()
  const [approvalTx, setApprovalTx] = useState('')
  const isApprovalTxPending = useIsTransactionPending(approvalTx)
  const res = useSingleCallResult(posManager, 'isApprovedForAll', [account, farmAddress])
  const isApprovedForAll = res?.result?.[0] || !farmAddress

  const handleApprove = async () => {
    if (!isApprovedForAll) {
      const tx = await approve()
      setApprovalTx(tx)
      mixpanel.track('ElasticFarmv2 - Approve Farming contract V2', { tx_hash: tx })
    }
  }

  const { data: poolDatas } = useGetElasticPools(farms?.map(f => f.poolAddress) || [])

  const toggleWalletModal = useWalletModalToggle()
  const renderApproveButton = () => {
    if (!account) {
      return (
        <div style={{ width: 'max-content' }}>
          <ConnectWalletButton onClick={toggleWalletModal} />
        </div>
      )
    }
    if (res?.loading) return <Dots />

    if (isApprovedForAll) {
      return (
        <Flex
          sx={{ gap: '8px' }}
          alignItems="center"
          flexDirection={upToSmall ? 'column' : 'row'}
          width={upToSmall ? '100%' : undefined}
        >
          <Flex
            sx={{ gap: '8px' }}
            alignItems="center"
            justifyContent={upToSmall ? 'space-between' : undefined}
            width={upToSmall ? '100%' : undefined}
          >
            <MouseoverTooltip
              text={t`Total value of liquidity positions (i.e. NFT tokens) you've deposited into the farming contract`}
            >
              <TextDashed fontSize="12px" fontWeight="500" color={theme.subText}>
                <Trans>Deposited Liquidity</Trans>
              </TextDashed>
            </MouseoverTooltip>

            <HoverDropdown
              style={{ padding: '0', color: theme.text }}
              content={
                account ? (
                  <Text as="span" fontSize="20px" fontWeight="500">
                    {formatDollarAmount(depositedUsd)}
                  </Text>
                ) : (
                  '--'
                )
              }
              hideIcon={!account || !depositedUsd}
              dropdownContent={
                Object.values(depositedTokenAmounts).some(amount => amount.greaterThan(0)) ? (
                  <AutoColumn>
                    {Object.values(depositedTokenAmounts).map(
                      amount =>
                        amount.greaterThan(0) && (
                          <Flex alignItems="center" key={amount.currency.wrapped.address}>
                            <CurrencyLogo currency={amount.currency} size="16px" />
                            <Text fontSize="12px" marginLeft="4px" fontWeight="500">
                              {amount.toSignificant(8)} {amount.currency.symbol}
                            </Text>
                          </Flex>
                        ),
                    )}
                  </AutoColumn>
                ) : (
                  ''
                )
              }
            />
          </Flex>

          <Flex
            alignItems="center"
            justifyContent={upToSmall ? 'space-between' : undefined}
            sx={{ gap: '8px' }}
            width={upToSmall ? '100%' : undefined}
          >
            <Text fontSize={12} color={theme.subText} fontWeight="500">
              <Trans>Rewards</Trans>
            </Text>

            <HoverDropdown
              style={{ padding: '0', color: theme.text }}
              content={
                account ? (
                  <Text as="span" fontSize="20px" fontWeight="500">
                    {formatDollarAmount(rewardUsd)}
                  </Text>
                ) : (
                  '--'
                )
              }
              hideIcon={!account || !depositedUsd}
              dropdownContent={
                Object.values(rewardTokenAmounts).some(amount => amount.greaterThan(0)) ? (
                  <AutoColumn>
                    {Object.values(rewardTokenAmounts).map(
                      amount =>
                        amount.greaterThan(0) && (
                          <Flex alignItems="center" key={amount.currency.wrapped.address}>
                            <CurrencyLogo currency={amount.currency} size="16px" />
                            <Text fontSize="12px" marginLeft="4px" fontWeight="500">
                              {amount.toSignificant(8)} {amount.currency.symbol}
                            </Text>
                          </Flex>
                        ),
                    )}
                  </AutoColumn>
                ) : (
                  ''
                )
              }
            />
          </Flex>
        </Flex>
      )
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
            <InfoHelper text={t`Once a farm has ended, you will continue to receive returns through LP Fees`} />
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flex-start">
          <ClickableText
            onClick={() => {
              handleSort(SORT_FIELD.APR)
            }}
          >
            <Trans>APR</Trans>

            {sortField === SORT_FIELD.APR &&
              (sortDirection === SORT_DIRECTION.DESC ? (
                <ArrowDown size={12} />
              ) : sortDirection === SORT_DIRECTION.ASC ? (
                <ArrowUp size={12} />
              ) : null)}
            <InfoHelper
              text={t`Average estimated return based on yearly trading fees from the pool & additional bonus rewards if you participate in the farm`}
            />
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
      {!!updatedFarms?.length && <NewRangesNotiModal updatedFarms={updatedFarms} />}
      <Flex
        justifyContent="space-between"
        sx={{ gap: '1rem' }}
        flexDirection={isApprovedForAll && upToSmall ? 'column' : 'row'}
      >
        <Flex fontSize="16px" alignItems="center" color={theme.text} sx={{ gap: '6px' }}>
          <Trans>Static Farms</Trans>

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
        {renderApproveButton()}
      </Flex>
      <Divider />
      <FarmList
        gridMode={viewMode === VIEW_MODE.GRID || !above1000}
        style={{ margin: '0', paddingBottom: viewMode === VIEW_MODE.GRID ? '12px' : '0' }}
      >
        {listMode && renderTableHeaderOnDesktop()}

        {filteredFarms?.map(farm =>
          listMode ? (
            <ListView
              key={farm.id}
              farm={farm}
              onStake={() => setSelectedFarm(farm)}
              onUnstake={() => setSelectedUnstakeFarm(farm)}
              onUpdateFarmClick={() => setSelectedUpdateFarm(farm)}
              poolAPR={poolDatas?.[farm.poolAddress]?.apr || 0}
              isApproved={isApprovedForAll}
            />
          ) : (
            <FarmCard
              key={farm.id}
              farm={farm}
              onStake={() => setSelectedFarm(farm)}
              onUnstake={() => setSelectedUnstakeFarm(farm)}
              onUpdateFarmClick={() => setSelectedUpdateFarm(farm)}
              poolAPR={poolDatas?.[farm.poolAddress]?.apr || 0}
              isApproved={isApprovedForAll}
            />
          ),
        )}
      </FarmList>

      {!!selectedFarm && (
        <StakeWithNFTsModal
          farm={selectedFarm}
          isOpen={!!selectedFarm}
          onDismiss={() => setSelectedFarm(null)}
          farmAddress={farmAddress}
        />
      )}
      {!!selectedUnstakeFarm && (
        <UnstakeWithNFTsModal
          farm={selectedUnstakeFarm}
          isOpen={!!selectedUnstakeFarm}
          onDismiss={() => setSelectedUnstakeFarm(null)}
          farmAddress={farmAddress}
        />
      )}
      {!!selectedUpdateFarm && (
        <UpdateLiquidityModal
          farm={selectedUpdateFarm}
          isOpen={!!selectedUpdateFarm}
          onDismiss={() => setSelectedUpdateFarm(null)}
          farmAddress={farmAddress}
        />
      )}
    </Wrapper>
  )
}
