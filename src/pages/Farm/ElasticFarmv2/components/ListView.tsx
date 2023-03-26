import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { Minus, Plus, Share2, X } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ReactComponent as DownSvg } from 'assets/svg/down.svg'
import { ButtonEmpty } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import { MoneyBag } from 'components/Icons'
import Harvest from 'components/Icons/Harvest'
import Modal from 'components/Modal'
import { MouseoverTooltip } from 'components/Tooltip'
import { ButtonColorScheme, MinimalActionButton } from 'components/YieldPools/ElasticFarmGroup/buttons'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { ElasticFarmV2TableRow } from 'components/YieldPools/styleds'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useFarmV2Action, useUserFarmV2Info } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2 } from 'state/farms/elasticv2/types'
import { shortenAddress } from 'utils'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { formatDollarAmount } from 'utils/numbers'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'

import { RangeItem } from './FarmCard'
import PriceVisualize from './PriceVisualize'
import StakeWithNFTsModal from './StakeWithNFTsModal'
import UnstakeWithNFTsModal from './UnstakeWithNFTsModal'

export const ListView = ({
  farm,
  poolAPR,
  isApproved,
}: {
  farm: ElasticFarmV2
  poolAPR: number
  isApproved: boolean
}) => {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()

  const [activeRangeIndex, setActiveRangeIndex] = useState(0)

  const currentTimestamp = Math.floor(Date.now() / 1000)
  const stakedPos = useUserFarmV2Info(farm.fId, farm.ranges[activeRangeIndex].index)
  const canUnstake = stakedPos.length > 0

  const hasRewards = stakedPos.some(item => item.unclaimedRewards.some(rw => rw.greaterThan('0')))

  const userTotalRewards = farm.totalRewards.map((item, index) => {
    return stakedPos
      .map(item => item.unclaimedRewards[index])
      .reduce((total, cur) => total.add(cur), CurrencyAmount.fromRawAmount(item.currency, 0))
  })

  const myDepositUSD = stakedPos.reduce((total, item) => item.stakedUsdValue + total, 0)

  const { harvest } = useFarmV2Action()
  const handleHarvest = useCallback(() => {
    harvest(farm?.fId, stakedPos?.filter(sp => sp.rangeId === activeRangeIndex).map(sp => sp.nftId.toNumber()) || [])
  }, [farm, harvest, stakedPos, activeRangeIndex])

  const { pool } = farm
  const addliquidityElasticPool = `${APP_PATHS.ELASTIC_CREATE_POOL}/${
    pool.token0.isNative ? pool.token0.symbol : pool.token0.address
  }/${pool.token1.isNative ? pool.token1.symbol : pool.token1.address}/${pool.fee}`

  const [showStake, setShowStake] = useState(false)
  const [showUnstake, setShowUnstake] = useState(false)
  const [showSelectActiveRange, setShowSelectActiveRange] = useState(false)

  return (
    <>
      <Modal isOpen={showSelectActiveRange} onDismiss={() => setShowSelectActiveRange(false)}>
        <Flex width="100%" flexDirection="column" padding="20px">
          <Flex alignItems="center" justifyContent="space-between">
            <Text fontWeight="500">
              <Trans>Farming Range</Trans>
            </Text>

            <ButtonEmpty onClick={() => setShowSelectActiveRange(false)} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>

          <Flex marginTop="1rem" flexDirection="column" overflowY="scroll" flex={1} sx={{ gap: '12px' }}>
            {farm.ranges.map((r, index: number) => (
              <RangeItem
                active={activeRangeIndex === index}
                farmId={farm.fId}
                key={r.id}
                rangeInfo={r}
                onRangeClick={() => setActiveRangeIndex(index)}
                token0={farm.token0}
                token1={farm.token1}
              />
            ))}
          </Flex>
        </Flex>
      </Modal>
      <ElasticFarmV2TableRow>
        <div>
          <Flex alignItems="center">
            <DoubleCurrencyLogo currency0={farm.token0} currency1={farm.token1} />
            <Link
              to={addliquidityElasticPool}
              style={{
                textDecoration: 'none',
              }}
            >
              <Text fontSize={14} fontWeight={500}>
                {getTokenSymbolWithHardcode(chainId, farm.token0.wrapped.address, farm.token0.symbol)} -{' '}
                {getTokenSymbolWithHardcode(chainId, farm.token1.wrapped.address, farm.token1.symbol)}
              </Text>
            </Link>

            <FeeTag>FEE {(farm.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
          </Flex>

          <Flex
            marginTop="0.5rem"
            alignItems="center"
            sx={{ gap: '3px' }}
            fontSize="12px"
            color={theme.subText}
            width="max-content"
            fontWeight="500"
          >
            <Flex alignItems="center" sx={{ gap: '4px' }}>
              <CopyHelper toCopy={farm.poolAddress} />
              <Text>{shortenAddress(chainId, farm.poolAddress, 2)}</Text>
            </Flex>

            <Flex
              marginLeft="12px"
              onClick={() => {
                //TODO: setSharePoolAddress(farmingPool.poolAddress)
              }}
              sx={{
                cursor: 'pointer',
                gap: '4px',
              }}
              role="button"
              color={theme.subText}
            >
              <Share2 size="14px" color={theme.subText} />
              <Trans>Share</Trans>
            </Flex>
          </Flex>
        </div>

        <Flex
          alignItems="center"
          sx={{ gap: '6px', cursor: 'pointer' }}
          role="button"
          onClick={() => setShowSelectActiveRange(true)}
        >
          <PriceVisualize
            tickCurrent={+farm.ranges[activeRangeIndex].tickCurrent}
            tickRangeLower={+farm.ranges[activeRangeIndex].tickLower}
            tickRangeUpper={+farm.ranges[activeRangeIndex].tickUpper}
            token0={farm.token0}
            token1={farm.token1}
          />

          <DownSvg />
        </Flex>

        <Text textAlign="left">{formatDollarAmount(farm.ranges[activeRangeIndex].tvl)}</Text>
        <Flex
          alignItems="center"
          justifyContent="flex-start"
          color={theme.apr}
          sx={{
            gap: '4px',
          }}
        >
          {((farm.ranges[activeRangeIndex].apr || 0) + poolAPR).toFixed(2)}%
          <MouseoverTooltip
            width="fit-content"
            placement="right"
            text={
              <APRTooltipContent farmAPR={0} farmV2APR={farm.ranges[activeRangeIndex].apr || 0} poolAPR={poolAPR} />
            }
          >
            <MoneyBag size={16} color={theme.apr} />
          </MouseoverTooltip>
        </Flex>

        <Text textAlign="right" color={theme.text}>
          {getFormattedTimeFromSecond(farm.endTime - currentTimestamp)}
        </Text>

        <Text textAlign="right" color={theme.text}>
          {formatDollarAmount(myDepositUSD)}
        </Text>

        <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '8px' }}>
          {userTotalRewards.map((amount, i) => (
            <Flex alignItems="center" sx={{ gap: '4px' }} key={amount.currency.symbol || i}>
              <HoverInlineText text={amount.toSignificant(6)} maxCharacters={10}></HoverInlineText>
              <MouseoverTooltip placement="top" text={amount.currency.symbol} width="fit-content">
                <CurrencyLogo currency={amount.currency} size="16px" />
              </MouseoverTooltip>
            </Flex>
          ))}
        </Flex>

        <Flex justifyContent="flex-end" sx={{ gap: '4px' }}>
          <MinimalActionButton disabled={!account || !isApproved} onClick={() => setShowStake(true)}>
            <Plus size={16} />
          </MinimalActionButton>

          <MinimalActionButton
            colorScheme={ButtonColorScheme.Gray}
            disabled={!canUnstake}
            onClick={() => setShowUnstake(true)}
          >
            <Minus size={16} />
          </MinimalActionButton>

          <MinimalActionButton colorScheme={ButtonColorScheme.APR} disabled={!hasRewards} onClick={handleHarvest}>
            <Harvest />
          </MinimalActionButton>
        </Flex>

        <StakeWithNFTsModal
          isOpen={showStake}
          onDismiss={() => setShowStake(false)}
          farm={farm}
          activeRangeIndex={activeRangeIndex}
        />
        {canUnstake && (
          <UnstakeWithNFTsModal
            isOpen={showUnstake}
            onDismiss={() => setShowUnstake(false)}
            stakedPos={stakedPos}
            farm={farm}
            activeRangeIndex={activeRangeIndex}
          />
        )}
      </ElasticFarmV2TableRow>
    </>
  )
}
