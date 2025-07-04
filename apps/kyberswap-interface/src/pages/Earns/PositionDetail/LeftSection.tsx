import { WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { Flex, Text } from 'rebass'

import HelpIcon from 'assets/svg/help-circle.svg'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import PositionHistory from 'pages/Earns/PositionDetail/PositionHistory'
import {
  InfoLeftColumn,
  InfoRight,
  InfoSection,
  InfoSectionFirstFormat,
  PositionAction,
  VerticalDivider,
} from 'pages/Earns/PositionDetail/styles'
import { DexImage } from 'pages/Earns/UserPositions/styles'
import { CoreProtocol, DEXES_SUPPORT_COLLECT_FEE, EarnDex } from 'pages/Earns/constants'
import useCollectFees from 'pages/Earns/hooks/useCollectFees'
import { ParsedPosition } from 'pages/Earns/types'
import { formatAprNumber, isForkFrom, isNativeToken } from 'pages/Earns/utils'
import { getUnclaimedFeesInfo } from 'pages/Earns/utils/fees'
import { formatDisplayNumber } from 'utils/numbers'

export interface FeeInfo {
  balance0: string
  balance1: string
  amount0: string
  amount1: string
  value0: number
  value1: number
  totalValue: number
}

const LeftSection = ({ position }: { position: ParsedPosition }) => {
  const theme = useTheme()
  const isToken0Native = isNativeToken(position.token0Address, position.chainId as keyof typeof WETH)
  const isToken1Native = isNativeToken(position.token1Address, position.chainId as keyof typeof WETH)
  const isUniv2 = isForkFrom(position.dex as EarnDex, CoreProtocol.UniswapV2)
  const [feeInfoFromRpc, setFeeInfoFromRpc] = useState<FeeInfo | undefined>()

  const handleFetchUnclaimedFee = useCallback(async () => {
    if (!position) return

    const feeFromRpc = await getUnclaimedFeesInfo(position)
    setFeeInfoFromRpc(feeFromRpc)
    setTimeout(() => setFeeInfoFromRpc(undefined), 2 * 60_000)
  }, [position])

  const {
    claimModal: claimFeesModal,
    onOpenClaim: onOpenClaimFees,
    claiming: feesClaiming,
  } = useCollectFees({
    refetchAfterCollect: () => handleFetchUnclaimedFee(),
  })

  const nativeToken = NETWORKS_INFO[position.chainId as keyof typeof NETWORKS_INFO].nativeToken

  return (
    <>
      {claimFeesModal}

      <InfoLeftColumn halfWidth={isUniv2}>
        <InfoSectionFirstFormat>
          <Text fontSize={14} color={theme.subText} marginTop={1}>
            {t`Total Liquidity`}
          </Text>
          <InfoRight>
            <Text fontSize={20}>
              {formatDisplayNumber(position.totalValue, {
                style: 'currency',
                significantDigits: 4,
              })}
            </Text>
            <Flex alignItems={'center'} sx={{ gap: '6px' }}>
              <DexImage
                src={position.token0Logo}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null
                  currentTarget.src = HelpIcon
                }}
              />
              <Text>{formatDisplayNumber(position.token0TotalAmount, { significantDigits: 6 })}</Text>
              <Text>{position.token0Symbol}</Text>
            </Flex>
            <Flex alignItems={'center'} sx={{ gap: '6px' }}>
              <DexImage
                src={position.token1Logo}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null
                  currentTarget.src = HelpIcon
                }}
              />
              <Text>{formatDisplayNumber(position.token1TotalAmount, { significantDigits: 6 })}</Text>
              <Text>{position.token1Symbol}</Text>
            </Flex>
          </InfoRight>
        </InfoSectionFirstFormat>
        <InfoSectionFirstFormat>
          <Flex alignItems={'center'} sx={{ marginTop: 1 }}>
            <Text fontSize={14} color={theme.subText}>
              {t`Est. Position APR`}
            </Text>
            <InfoHelper text={t`Estimated 7 days APR`} placement="top" />
          </Flex>
          <Text fontSize={20} color={position.apr > 0 ? theme.primary : theme.text}>
            {formatAprNumber(position.apr * 100)}%
          </Text>
        </InfoSectionFirstFormat>
        <InfoSection>
          <Text fontSize={14} color={theme.subText} marginBottom={3}>
            {t`Fee Earn`}
          </Text>
          <Flex alignItems={'center'} justifyContent={'space-between'}>
            <Flex flexDirection={'column'} sx={{ gap: 2 }}>
              <Text fontSize={14} color={theme.subText}>
                1 {t`day`}
              </Text>
              <Text>
                {(position.earning24h || position.earning24h === 0) && !isUniv2
                  ? formatDisplayNumber(position.earning24h, { significantDigits: 4, style: 'currency' })
                  : '--'}
              </Text>
            </Flex>
            <VerticalDivider />
            <Flex flexDirection={'column'} sx={{ gap: 2 }}>
              <Text fontSize={14} color={theme.subText}>
                7 {t`days`}
              </Text>
              <Text>
                {(position.earning7d || position.earning7d === 0) && !isUniv2
                  ? formatDisplayNumber(position.earning7d, { significantDigits: 4, style: 'currency' })
                  : '--'}
              </Text>
            </Flex>
            <VerticalDivider />
            <Flex flexDirection={'column'} sx={{ gap: 2 }}>
              <Text fontSize={14} color={theme.subText}>
                {t`All`}
              </Text>
              <Text fontSize={18} color={position.totalEarnedFee > 0 ? theme.primary : theme.text}>
                {(position.totalEarnedFee || position.totalEarnedFee === 0) && position.totalEarnedFee >= 0
                  ? formatDisplayNumber(position.totalEarnedFee, { style: 'currency', significantDigits: 4 })
                  : position.totalEarnedFee && position.totalEarnedFee < 0
                  ? 0
                  : '--'}
              </Text>
            </Flex>
          </Flex>
        </InfoSection>
        {DEXES_SUPPORT_COLLECT_FEE[position.dex as EarnDex] ? (
          <InfoSection>
            <Flex alignItems={'center'} justifyContent={'space-between'} marginBottom={2}>
              <Text fontSize={14} color={theme.subText} marginTop={1}>
                {t`Total Unclaimed Fees`}
              </Text>
              <Text fontSize={18}>
                {feeInfoFromRpc || position?.unclaimedFees
                  ? formatDisplayNumber(feeInfoFromRpc ? feeInfoFromRpc.totalValue : position.unclaimedFees, {
                      significantDigits: 4,
                      style: 'currency',
                    })
                  : '--'}
              </Text>
            </Flex>
            <Flex alignItems={'center'} justifyContent={'space-between'}>
              <div>
                <Flex alignItems={'center'} sx={{ gap: '6px' }} marginBottom={1}>
                  <Text>
                    {formatDisplayNumber(feeInfoFromRpc ? feeInfoFromRpc.amount0 : position?.token0UnclaimedAmount, {
                      significantDigits: 4,
                    })}
                  </Text>
                  <Text>{isToken0Native ? nativeToken.symbol : position.token0Symbol}</Text>
                  <Text fontSize={14} color={theme.subText}>
                    {formatDisplayNumber(feeInfoFromRpc ? feeInfoFromRpc.value0 : position?.token0UnclaimedValue, {
                      style: 'currency',
                      significantDigits: 4,
                    })}
                  </Text>
                </Flex>
                <Flex alignItems={'center'} sx={{ gap: '6px' }}>
                  <Text>
                    {formatDisplayNumber(feeInfoFromRpc ? feeInfoFromRpc.amount1 : position?.token1UnclaimedAmount, {
                      significantDigits: 4,
                    })}
                  </Text>
                  <Text>{isToken1Native ? nativeToken.symbol : position.token1Symbol}</Text>
                  <Text fontSize={14} color={theme.subText}>
                    {formatDisplayNumber(feeInfoFromRpc ? feeInfoFromRpc.value1 : position?.token1UnclaimedValue, {
                      style: 'currency',
                      significantDigits: 4,
                    })}
                  </Text>
                </Flex>
              </div>
              <PositionAction
                small
                outline
                mobileAutoWidth
                load={feesClaiming}
                disabled={position?.unclaimedFees === 0 || feesClaiming}
                onClick={() =>
                  position?.unclaimedFees && position?.unclaimedFees > 0 && !feesClaiming && onOpenClaimFees(position)
                }
              >
                {feesClaiming && <Loader size="14px" />}
                {feesClaiming ? t`Claiming` : t`Claim`}
              </PositionAction>
            </Flex>
          </InfoSection>
        ) : null}
        {!isUniv2 && <PositionHistory position={position} />}
      </InfoLeftColumn>
    </>
  )
}

export default LeftSection
