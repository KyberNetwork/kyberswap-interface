import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
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
import { useSmartExit } from 'pages/Earns/components/SmartExit/useSmartExit'
import { SMART_EXIT_ADDRESS } from 'pages/Earns/constants'
import { ConditionType, Metric, ParsedPosition } from 'pages/Earns/types'

export const Confirmation = ({
  selectedMetrics,
  pos,
  onDismiss,
  feeYieldCondition,
  priceCondition,
  timeCondition,
  deadline,
  conditionType,
  feeSettings: { protocolFee, maxFeesPercentage },
}: {
  selectedMetrics: Metric[]
  pos: ParsedPosition
  onDismiss: () => void
  conditionType: ConditionType
  deadline: number
  feeYieldCondition: string
  priceCondition: { lte: string; gte: string }
  timeCondition: { time: number | null; condition: 'after' | 'before' }
  feeSettings: { protocolFee: number; maxFeesPercentage: number }
}) => {
  const theme = useTheme()

  const { chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const { permitState, signPermitNft, permitData } = usePermitNft({
    contractAddress: pos.id.split('-')[0],
    tokenId: pos.tokenId,
    spender: SMART_EXIT_ADDRESS,
    deadline,
  })

  const { createSmartExitOrder, isCreating, isSuccess } = useSmartExit({
    position: pos,
    selectedMetrics,
    conditionType,
    feeYieldCondition,
    priceCondition,
    timeCondition,
    deadline,
    permitData: permitData?.permitData,
    signature: permitData?.signature,
  })

  const displayTime = dayjs(deadline * 1000).format('DD/MM/YYYY HH:mm:ss')

  const [condition0, condition1] = selectedMetrics

  const navigate = useNavigate()

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
            <TokenLogo src={pos?.token0.logo} />
            <TokenLogo src={pos?.token1.logo} translateLeft />
            <TokenLogo src={pos.chain.logo} size={12} translateLeft translateTop />
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
              {conditionType === ConditionType.And ? <Trans>And</Trans> : <Trans>Or</Trans>}
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
          if (chainId !== pos.chain.id) {
            changeNetwork(pos.chain.id)
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
        {chainId !== pos.chain.id ? (
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
