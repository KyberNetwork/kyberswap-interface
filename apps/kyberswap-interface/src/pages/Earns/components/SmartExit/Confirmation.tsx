import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { X } from 'react-feather'
import { Box, Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { TIMES_IN_SECS } from 'constants/index'
import { PermitNftState, usePermitNft } from 'hooks/usePermitNft'
import useTheme from 'hooks/useTheme'
import { Badge, ChainImage, ImageContainer } from 'pages/Earns/UserPositions/styles'
import { ParsedPosition } from 'pages/Earns/types'

import { Metric } from './Metrics'
import { useSmartExit } from './useSmartExit'

export const Confirmation = ({
  selectedMetrics,
  pos,
  onDismiss,
  feeYieldCondition,
  priceCondition,
  timeCondition,
  expireTime,
  conditionType,
}: {
  selectedMetrics: Metric[]
  pos: ParsedPosition
  onDismiss: () => void
  conditionType: 'and' | 'or'
  expireTime: number
  feeYieldCondition: string
  priceCondition: { lte: string; gte: string }
  timeCondition: { time: number | null; condition: 'after' | 'before' }
}) => {
  const theme = useTheme()

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const time = [7 * TIMES_IN_SECS.ONE_DAY, 30 * TIMES_IN_SECS.ONE_DAY, 90 * TIMES_IN_SECS.ONE_DAY].includes(expireTime)
    ? Math.floor(today.getTime() / 1000) + expireTime
    : expireTime

  const { permitState, signPermitNft, permitData } = usePermitNft({
    contractAddress: pos.id.split('-')[0],
    tokenId: pos.tokenId,
    // TODO
    spender: '0xCa611DEb2914056D392bF77e13aCD544334dD957',
    deadline: time,
  })

  const { createSmartExitOrder, isCreating, isSuccess } = useSmartExit({
    position: pos,
    selectedMetrics,
    conditionType,
    feeYieldCondition,
    priceCondition,
    timeCondition,
    expireTime: time,
    permitData: permitData?.permitData,
    signature: permitData?.signature,
  })

  const displayTime = dayjs(time * 1000).format('DD/MM/YYYY HH:mm:ss')

  const [condition0, condition1] = selectedMetrics

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize={20} fontWeight={500}>
          <Trans>Confirmation</Trans>
        </Text>
        <X onClick={onDismiss} />
      </Flex>

      <Flex mt="1rem" alignItems="center">
        <Trans>Exit</Trans>
        <Flex mx="12px" alignItems="center">
          <ImageContainer>
            <TokenLogo src={pos?.token0.logo} />
            <TokenLogo src={pos?.token1.logo} translateLeft />
            <ChainImage src={pos?.chain.logo} alt="" />
          </ImageContainer>
          <Text mr="8px">
            {pos.token0.symbol}/{pos.token1.symbol}
          </Text>
          <Badge>Fee {pos?.pool.fee}%</Badge>
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
        {condition0 === Metric.FeeYield && <Trans>The fee yield ≥ {feeYieldCondition}%</Trans>}
        {condition0 === Metric.Time && (
          <>
            <Text>{timeCondition.condition.charAt(0).toUpperCase() + timeCondition.condition.slice(1)}</Text>
            <Text>{dayjs(timeCondition.time).format('DD/MM/YYYY HH:mm:ss')}</Text>
          </>
        )}
        {condition0 === Metric.PoolPrice && (
          <>
            <Text>
              <Trans>Pool price is between</Trans>
            </Text>
            <Text>
              {priceCondition.gte} and {priceCondition.lte} {pos.token0.symbol}/{pos.token1.symbol}
            </Text>
          </>
        )}
        {condition1 && (
          <>
            <Flex alignItems="center" sx={{ gap: '1rem' }} my="8px">
              <Box
                sx={{
                  height: '1px',
                  borderBottom: `1px dashed ${theme.border}`,
                  flex: 1,
                }}
              />
              {conditionType === 'and' ? <Trans>And</Trans> : <Trans>Or</Trans>}
              <Box
                sx={{
                  height: '1px',
                  borderBottom: `1px dashed ${theme.border}`,
                  flex: 1,
                }}
              />
            </Flex>

            {condition1 === Metric.FeeYield && <Trans>The fee yield ≥ {feeYieldCondition}%</Trans>}
            {condition1 === Metric.Time && (
              <>
                <Text>{timeCondition.condition.charAt(0).toUpperCase() + timeCondition.condition.slice(1)}</Text>
                <Text mt="6px">{dayjs(timeCondition.time).format('DD/MM/YYYY HH:mm:ss')}</Text>
              </>
            )}
            {condition1 === Metric.PoolPrice && (
              <>
                <Text>
                  <Trans>Pool price is between</Trans>
                </Text>
                <Text mt="6px">
                  {priceCondition.gte} and {priceCondition.lte} {pos.token0.symbol}/{pos.token1.symbol}
                </Text>
              </>
            )}
          </>
        )}
      </Box>

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

      {isSuccess ? (
        <Flex sx={{ gap: '12px' }} mt="16px">
          <ButtonOutlined
            onClick={() => {
              // TODO: Navigate to orders page or open order details
              console.log('View order clicked')
            }}
            flex={1}
          >
            <Trans>View Order</Trans>
          </ButtonOutlined>
          <ButtonPrimary onClick={onDismiss} flex={1}>
            <Trans>Close</Trans>
          </ButtonPrimary>
        </Flex>
      ) : (
        <ButtonPrimary
          disabled={permitState === PermitNftState.SIGNING || isCreating}
          onClick={async () => {
            if (permitState === PermitNftState.SIGNED && permitData) {
              // Create smart exit order
              await createSmartExitOrder()
              return
            }
            if (permitState === PermitNftState.READY_TO_SIGN) {
              await signPermitNft()
            }
          }}
        >
          {isCreating ? (
            <Trans>Creating Order...</Trans>
          ) : permitState === PermitNftState.SIGNED ? (
            <Trans>Confirm Smart Exit</Trans>
          ) : permitState === PermitNftState.SIGNING ? (
            <Trans>Signing...</Trans>
          ) : (
            <Trans>Permit NFT</Trans>
          )}
        </ButtonPrimary>
      )}
    </>
  )
}
