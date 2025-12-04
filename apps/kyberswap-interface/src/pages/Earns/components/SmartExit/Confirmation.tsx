import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { X } from 'react-feather'
import { useNavigate } from 'react-router'
import { Box, Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { CheckCircle } from 'components/Icons'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { PermitNftState, usePermitNft } from 'hooks/usePermitNft'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { Badge, ImageContainer } from 'pages/Earns/UserPositions/styles'
import { calculateExpectedAmounts } from 'pages/Earns/components/SmartExit/calculateExpectedAmounts'
import { useSmartExit } from 'pages/Earns/components/SmartExit/useSmartExit'
import { SMART_EXIT_ADDRESS } from 'pages/Earns/constants'
import {
  ConditionType,
  FeeYieldCondition,
  Metric,
  ParsedPosition,
  PriceCondition,
  SelectedMetric,
  TimeCondition,
} from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

export const Confirmation = ({
  selectedMetrics,
  position,
  deadline,
  conditionType,
  feeSettings: { protocolFee, maxFeesPercentage },
  onDismiss,
}: {
  selectedMetrics: SelectedMetric[]
  position: ParsedPosition
  conditionType: ConditionType
  deadline: number
  feeSettings: { protocolFee: number; maxFeesPercentage: number }
  onDismiss: () => void
}) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const { permitState, signPermitNft, permitData } = usePermitNft({
    contractAddress: position.id.split('-')[0],
    tokenId: position.tokenId,
    spender: SMART_EXIT_ADDRESS,
    deadline,
  })

  const { createSmartExitOrder, isCreating, isSuccess } = useSmartExit({
    position,
    selectedMetrics,
    conditionType,
    deadline,
    permitData: permitData?.permitData,
    signature: permitData?.signature,
  })

  const [metric1, metric2] = selectedMetrics

  const feeYieldCondition1 = metric1.condition as FeeYieldCondition
  const priceCondition1 = metric1.condition as PriceCondition
  const timeCondition1 = metric1.condition as TimeCondition
  const feeYieldCondition2 = metric2?.condition as FeeYieldCondition
  const priceCondition2 = metric2?.condition as PriceCondition
  const timeCondition2 = metric2?.condition as TimeCondition

  const displayTime = dayjs(deadline * 1000).format('DD/MM/YYYY HH:mm:ss')

  // Calculate expected amounts for pool price conditions
  const expectedAmounts = useMemo(() => {
    // Check if any metric is pool price
    const poolPriceMetrics = selectedMetrics.filter(m => m.metric === Metric.PoolPrice)
    if (poolPriceMetrics.length === 0) return null

    // If there are multiple pool price conditions, merge them
    let mergedCondition: PriceCondition | null = null

    if (poolPriceMetrics.length === 1) {
      mergedCondition = poolPriceMetrics[0].condition as PriceCondition
    } else if (poolPriceMetrics.length === 2) {
      // When using AND: take the intersection (more restrictive range)
      // When using OR: take the union (wider range)
      const condition1 = poolPriceMetrics[0].condition as PriceCondition
      const condition2 = poolPriceMetrics[1].condition as PriceCondition

      if (conditionType === ConditionType.And) {
        // Intersection: higher min, lower max
        mergedCondition = {
          gte: Math.max(parseFloat(condition1.gte), parseFloat(condition2.gte)).toString(),
          lte: Math.min(parseFloat(condition1.lte), parseFloat(condition2.lte)).toString(),
        }
      } else {
        // Union: lower min, higher max
        mergedCondition = {
          gte: Math.min(parseFloat(condition1.gte), parseFloat(condition2.gte)).toString(),
          lte: Math.max(parseFloat(condition1.lte), parseFloat(condition2.lte)).toString(),
        }
      }
    }

    return mergedCondition ? calculateExpectedAmounts(position, mergedCondition) : null
  }, [position, selectedMetrics, conditionType])

  if (isSuccess)
    return (
      <>
        <Flex justifyContent="space-between" alignItems="center">
          <div></div>
          <X onClick={onDismiss} />
        </Flex>

        <Flex justifyContent="center" alignItems="center" sx={{ gap: '8px' }} fontSize={20} fontWeight={500}>
          <CheckCircle color={theme.primary} size="20px" />

          <Text>
            <Trans>Condition saved</Trans>
          </Text>
        </Flex>

        <Text mt="24px" color={theme.subText} fontSize={14}>
          <Trans>Your Smart Exit condition has been created successfully.</Trans>
        </Text>

        <Flex sx={{ gap: '12px' }} mt="24px">
          <ButtonOutlined onClick={onDismiss} flex={1}>
            <Trans>Cancel</Trans>
          </ButtonOutlined>
          <ButtonPrimary
            flex={1}
            onClick={() => {
              navigate(APP_PATHS.EARN_SMART_EXIT)
            }}
          >
            <Trans>View All Condition(s)</Trans>
          </ButtonPrimary>
        </Flex>
      </>
    )

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize={20} fontWeight={500}>
          <Trans>Confirmation</Trans>
        </Text>
        <X onClick={onDismiss} />
      </Flex>

      <Flex mt="1rem" alignItems="center" flexWrap="wrap">
        <Trans>Exit</Trans>
        <Flex mx="12px" alignItems="center">
          <ImageContainer>
            <TokenLogo src={position?.token0.logo} />
            <TokenLogo src={position?.token1.logo} translateLeft />
            <TokenLogo src={position.chain.logo} size={12} translateLeft translateTop />
          </ImageContainer>
          <Text mr="8px">
            {position.token0.symbol}/{position.token1.symbol}
          </Text>
          <Badge>Fee {position?.pool.fee}%</Badge>
        </Flex>
        <Trans>When</Trans>
      </Flex>

      <Box
        sx={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: `${theme.primary}22`,
          marginTop: '1rem',
        }}
      >
        {metric1.metric === Metric.FeeYield && <Trans>The fee yield ≥ {feeYieldCondition1}%</Trans>}
        {metric1.metric === Metric.Time && (
          <>
            <Text>{timeCondition1.condition.charAt(0).toUpperCase() + timeCondition1.condition.slice(1)}</Text>
            <Text>{dayjs(timeCondition1.time).format('DD/MM/YYYY HH:mm:ss')}</Text>
          </>
        )}
        {metric1.metric === Metric.PoolPrice && (
          <>
            <Text>
              <Trans>Pool price is between</Trans>
            </Text>
            <Text>
              {priceCondition1.gte} and {priceCondition1.lte} {position.token0.symbol}/{position.token1.symbol}
            </Text>
          </>
        )}
        {metric2 && (
          <>
            <Flex alignItems="center" sx={{ gap: '1rem' }} my="8px">
              <Box
                sx={{
                  height: '1px',
                  borderBottom: `1px dashed ${theme.border}`,
                  flex: 1,
                }}
              />
              {conditionType === ConditionType.And ? <Trans>And</Trans> : <Trans>Or</Trans>}
              <Box
                sx={{
                  height: '1px',
                  borderBottom: `1px dashed ${theme.border}`,
                  flex: 1,
                }}
              />
            </Flex>

            {metric2.metric === Metric.FeeYield && <Trans>The fee yield ≥ {feeYieldCondition2}%</Trans>}
            {metric2.metric === Metric.Time && (
              <>
                <Text>{timeCondition2.condition.charAt(0).toUpperCase() + timeCondition2.condition.slice(1)}</Text>
                <Text mt="6px">{dayjs(timeCondition2.time).format('DD/MM/YYYY HH:mm:ss')}</Text>
              </>
            )}
            {metric2.metric === Metric.PoolPrice && (
              <>
                <Text>
                  <Trans>Pool price is between</Trans>
                </Text>
                <Text mt="6px">
                  {priceCondition2.gte} and {priceCondition2.lte} {position.token0.symbol}/{position.token1.symbol}
                </Text>
              </>
            )}
          </>
        )}
      </Box>

      {expectedAmounts && (
        <Box
          sx={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: theme.buttonBlack,
            marginTop: '1rem',
          }}
        >
          <Text fontSize={14} color={theme.subText} mb="12px">
            <Trans>Estimated balance when exit</Trans>
          </Text>

          <Flex justifyContent="space-between" mb="12px">
            <Flex flexDirection="column" flex={1}>
              <Text fontSize={12} color={theme.subText} mb="8px">
                Min
              </Text>
              <Flex alignItems="center" sx={{ gap: '8px' }} mb="8px">
                <TokenLogo src={position.token0.logo} size={16} />
                <Text fontSize={14}>
                  {formatDisplayNumber(expectedAmounts.minAmount0, { significantDigits: 6 })} {position.token0.symbol}
                </Text>
              </Flex>
              <Flex alignItems="center" sx={{ gap: '8px' }}>
                <TokenLogo src={position.token1.logo} size={16} />
                <Text fontSize={14}>
                  {formatDisplayNumber(expectedAmounts.minAmount1, { significantDigits: 6 })} {position.token1.symbol}
                </Text>
              </Flex>
            </Flex>

            <Flex flexDirection="column" flex={1}>
              <Text fontSize={12} color={theme.subText} mb="8px">
                Max
              </Text>
              <Flex alignItems="center" sx={{ gap: '8px' }} mb="8px">
                <TokenLogo src={position.token0.logo} size={16} />
                <Text fontSize={14}>
                  {formatDisplayNumber(expectedAmounts.maxAmount0, { significantDigits: 6 })} {position.token0.symbol}
                </Text>
              </Flex>
              <Flex alignItems="center" sx={{ gap: '8px' }}>
                <TokenLogo src={position.token1.logo} size={16} />
                <Text fontSize={14}>
                  {formatDisplayNumber(expectedAmounts.maxAmount1, { significantDigits: 6 })} {position.token1.symbol}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Box>
      )}

      <Flex justifyContent={'space-between'} mt="1rem">
        <Text color={theme.subText} fontSize={14}>
          <Trans>Platform Fee</Trans>
        </Text>
        <Text color={theme.text} fontSize={14}>
          {protocolFee}%
        </Text>
      </Flex>

      <Flex justifyContent={'space-between'} mt="1rem">
        <TextDashed
          color={theme.subText}
          fontSize={14}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 'fit-content',
          }}
        >
          <MouseoverTooltip
            placement="right"
            text={t`Once an order expires, it will be cancelled automatically. No gas fees will be charged.`}
          >
            <Trans>Expires in</Trans>
          </MouseoverTooltip>
        </TextDashed>
        <Text color={theme.text} fontSize={14}>
          {displayTime}
        </Text>
      </Flex>

      <Text fontStyle="italic" fontSize={14} color={theme.subText} my="1rem">
        <Trans>
          The information is intended solely for your reference at the time you are viewing. It is your responsibility
          to verify all information before making decisions
        </Trans>
      </Text>

      <ButtonPrimary
        disabled={permitState === PermitNftState.SIGNING || isCreating || !maxFeesPercentage}
        onClick={async () => {
          if (!maxFeesPercentage) return
          if (chainId !== position.chain.id) {
            changeNetwork(position.chain.id)
            return
          }

          if (permitState === PermitNftState.SIGNED && permitData) {
            // Create smart exit order
            await createSmartExitOrder({ maxFeesPercentage: [maxFeesPercentage, maxFeesPercentage] })
            return
          }
          if (permitState === PermitNftState.READY_TO_SIGN) {
            await signPermitNft()
          }
        }}
      >
        {chainId !== position.chain.id ? (
          <Trans>Switch Network</Trans>
        ) : isCreating ? (
          <Trans>Creating Order...</Trans>
        ) : permitState === PermitNftState.SIGNED ? (
          <Trans>Confirm Smart Exit</Trans>
        ) : permitState === PermitNftState.SIGNING ? (
          <Trans>Signing...</Trans>
        ) : (
          <Trans>Permit NFT</Trans>
        )}
      </ButtonPrimary>
    </>
  )
}
