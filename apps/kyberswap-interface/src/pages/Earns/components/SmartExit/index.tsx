import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import { SmartExitFeeResponse } from 'services/smartExit'
import styled from 'styled-components'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import Modal from 'components/Modal'
import Input from 'components/NumericalInput'
import { DropdownIcon } from 'components/SwapForm/SlippageSetting'
import TokenLogo from 'components/TokenLogo'
import { TIMES_IN_SECS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import { RevertIconWrapper } from 'pages/Earns/PositionDetail/styles'
import PriceRange from 'pages/Earns/UserPositions/PriceRange'
import { PositionValueWrapper } from 'pages/Earns/UserPositions/styles'
import { Confirmation } from 'pages/Earns/components/SmartExit/Confirmation'
import { Metric, Metrics } from 'pages/Earns/components/SmartExit/Metrics'
import { useSmartExit } from 'pages/Earns/components/SmartExit/useSmartExit'
import { ParsedPosition } from 'pages/Earns/types'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const Content = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: row;
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`

const CustomBox = styled.div`
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 12px;
  flex-direction: column;
  gap: 0.5rem;
  display: flex;
`

export const SmartExit = ({
  isOpen,
  onDismiss,
  position,
}: {
  isOpen: boolean
  onDismiss: () => void
  position: ParsedPosition
}) => {
  const theme = useTheme()
  const [revertPrice, setRevertPrice] = useState(false)
  const [selectedMetrics, setSelectedMetrics] = useState<[Metric, Metric | null]>([Metric.FeeYield, null])
  const [conditionType, setConditionType] = useState<'and' | 'or'>('and')

  const [expireTime, setExpireTime] = useState(TIMES_IN_SECS.ONE_DAY * 30)
  const deadline = useMemo(() => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const time = [7 * TIMES_IN_SECS.ONE_DAY, 30 * TIMES_IN_SECS.ONE_DAY, 90 * TIMES_IN_SECS.ONE_DAY].includes(
      expireTime,
    )
      ? Math.floor(today.getTime()) + expireTime * 1000
      : expireTime

    return Math.floor(time / 1000)
  }, [expireTime])

  const [feeYieldCondition, setFeeYieldCondition] = useState('')
  const [priceCondition, setPriceCondition] = useState<{ gte: string; lte: string }>({ lte: '', gte: '' })
  const [timeCondition, setTimeCondition] = useState<{ time: number | null; condition: 'after' | 'before' }>({
    time: null,
    condition: 'after',
  })

  const invalidYield = selectedMetrics.includes(Metric.FeeYield) && !feeYieldCondition
  const invalidPriceCondition =
    selectedMetrics.includes(Metric.PoolPrice) &&
    (!priceCondition.gte || !priceCondition.lte || Number(priceCondition.gte) > Number(priceCondition.lte))
  const invalidTime = selectedMetrics.includes(Metric.Time) && !timeCondition.time

  const disableBtn = invalidYield || invalidPriceCondition || invalidTime

  const [showConfirm, setShowConfirm] = useState(false)

  // Gas estimation + selection state
  const [feeInfo, setFeeInfo] = useState<SmartExitFeeResponse | null>(null)
  const [feeLoading, setFeeLoading] = useState(false)
  const [multiplier, setMultiplier] = useState<number>(1.5)
  const [feeSettingExpanded, setFeeSettingExpanded] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const [customGasUsd, setCustomGasUsd] = useState<string>('')
  const isWarningGas = feeInfo && customGasUsd && parseFloat(customGasUsd) < (feeInfo.gas.usd || 0)
  const isHighlightGas =
    feeInfo &&
    !feeSettingExpanded &&
    (customGasUsd ? parseFloat(customGasUsd) > feeInfo.gas.usd : feeInfo.gas.usd * multiplier > feeInfo.gas.usd)

  const { estimateFee } = useSmartExit({
    position,
    selectedMetrics: selectedMetrics.filter(Boolean) as Metric[],
    conditionType,
    feeYieldCondition,
    priceCondition,
    timeCondition,
    deadline,
  })

  // Auto-estimate when metrics are valid
  useEffect(() => {
    if (disableBtn) return

    const call = async () => {
      if (feeLoading || feeInfo) return
      setFeeLoading(true)
      try {
        const res = await estimateFee()
        setFeeInfo(res)
      } catch {
        if (feeInfo) setFeeInfo(null)
      } finally {
        setFeeLoading(false)
      }
    }

    // immediate call
    call()

    // poll every 15s
    intervalRef.current = window.setInterval(call, 15000)

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableBtn])

  const setupContent = (
    <>
      <Flex justifyContent="space-between" alignItems="center" mb="16px">
        <Text fontSize={20} fontWeight={500}>
          <Trans>Set Up Smart Exit</Trans>
        </Text>
        <X onClick={onDismiss} />
      </Flex>

      <PositionDetailHeader
        style={{ flexDirection: 'row' }}
        position={position}
        showBackIcon={false}
        isLoading={false}
        initialLoading={false}
        rightComponent={<div></div>}
      />

      <Content>
        <Flex flexDirection="column" sx={{ gap: '1rem' }} flex={1}>
          <CustomBox>
            <Flex alignItems="center" justifyContent="space-between">
              <Text color={theme.subText} fontSize={14}>
                <Trans>Your Position Liquidity</Trans>
              </Text>
              <Text>{formatDisplayNumber(position.totalValue, { style: 'currency', significantDigits: 4 })}</Text>
            </Flex>
            <Flex justifyContent="space-between" alignItems="flex-start">
              <Flex alignItems="center" sx={{ gap: '4px' }}>
                <TokenLogo src={position.token0.logo} size={16} />
                {position.token0.symbol}
              </Flex>
              <Flex flexDirection="column" sx={{ gap: '4px' }} alignItems="flex-end">
                <Text>{formatDisplayNumber(position.token0.totalProvide, { significantDigits: 6 })}</Text>
                <Text fontSize={12} color={theme.subText}>
                  {formatDisplayNumber(position.token0.price * position.token0.totalProvide, {
                    style: 'currency',
                    significantDigits: 6,
                  })}
                </Text>
              </Flex>
            </Flex>
            <Flex justifyContent="space-between" alignItems="flex-start">
              <Flex alignItems="center" sx={{ gap: '4px' }}>
                <TokenLogo src={position.token1.logo} size={16} />
                {position.token1.symbol}
              </Flex>

              <Flex flexDirection="column" sx={{ gap: '4px' }} alignItems="flex-end">
                <Text>{formatDisplayNumber(position.token1.totalProvide, { significantDigits: 6 })}</Text>
                <Text fontSize={12} color={theme.subText}>
                  {formatDisplayNumber(position.token1.price * position.token1.totalProvide, {
                    style: 'currency',
                    significantDigits: 6,
                  })}
                </Text>
              </Flex>
            </Flex>
          </CustomBox>

          <CustomBox>
            <Flex alignItems="center" sx={{ gap: '4px' }} mb="1rem">
              <Text color={theme.subText} fontSize={14}>
                Current Price
              </Text>
              <Text>
                1 {revertPrice ? position.token1.symbol : position.token0.symbol} ={' '}
                {formatDisplayNumber(revertPrice ? 1 / position.priceRange.current : position.priceRange.current, {
                  significantDigits: 6,
                })}{' '}
                {revertPrice ? position.token0.symbol : position.token1.symbol}
              </Text>
              <RevertIconWrapper onClick={() => setRevertPrice(!revertPrice)}>
                <RevertPriceIcon width={12} height={12} />
              </RevertIconWrapper>
            </Flex>

            <PositionValueWrapper align="center">
              <PriceRange
                minPrice={position.priceRange.min}
                maxPrice={position.priceRange.max}
                currentPrice={position.priceRange.current}
                tickSpacing={position.pool.tickSpacing}
                token0Decimals={position.token0.decimals}
                token1Decimals={position.token1.decimals}
                dex={position.dex.id}
              />
            </PositionValueWrapper>

            <Divider mt="1rem" />

            <Flex alignItems="center" mt="10px" justifyContent="space-between">
              <Text color={theme.subText} fontSize={14}>
                <Trans>Earning Fee Yield</Trans>{' '}
                <InfoHelper
                  text={
                    <Text>
                      <Trans>
                        Based on the amount of fee tokens your position has earned compared with your initial deposit.
                      </Trans>
                      <ExternalLink href="/TODO">
                        <Text as="span" ml="4px">
                          <Trans>Details</Trans>
                        </Text>
                      </ExternalLink>
                    </Text>
                  }
                />{' '}
              </Text>
              <Text>{position.earningFeeYield.toFixed(2)}%</Text>
            </Flex>
          </CustomBox>
        </Flex>

        <Flex flexDirection="column" flex={1}>
          <Metrics
            position={position}
            selectedMetrics={selectedMetrics}
            setSelectedMetrics={setSelectedMetrics}
            conditionType={conditionType}
            setConditionType={setConditionType}
            expireTime={expireTime}
            setExpireTime={setExpireTime}
            feeYieldCondition={feeYieldCondition}
            setFeeYieldCondition={setFeeYieldCondition}
            priceCondition={priceCondition}
            setPriceCondition={setPriceCondition}
            timeCondition={timeCondition}
            setTimeCondition={setTimeCondition}
          />
          <Divider my="1rem" />
          <Flex alignItems="center" justifyContent="space-between">
            <Text>{t`Max Execution Gas`}:</Text>
            {!feeInfo ? (
              <Text>--</Text>
            ) : (
              <Flex alignItems="center">
                <Text color={isWarningGas ? rgba(theme.warning, 0.9) : theme.text}>
                  ${customGasUsd ? customGasUsd : (feeInfo.gas.usd * multiplier).toFixed(2)}
                </Text>
                <DropdownIcon
                  data-flip={feeSettingExpanded}
                  data-highlight={isHighlightGas}
                  data-warning={isWarningGas}
                  onClick={() => setFeeSettingExpanded(e => !e)}
                >
                  <svg width="10" height="6" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3.70711 3.29289L5.29289 1.70711C5.92286 1.07714 5.47669 0 4.58579 0H1.41421C0.523309 0 0.0771406 1.07714 0.707105 1.70711L2.29289 3.29289C2.68342 3.68342 3.31658 3.68342 3.70711 3.29289Z"
                      fill="currentColor"
                    />
                  </svg>
                </DropdownIcon>
              </Flex>
            )}
          </Flex>
          <Flex
            sx={{
              transition: 'all 100ms linear',
              paddingTop: feeSettingExpanded && feeInfo ? '8px' : '0px',
              height: feeSettingExpanded && feeInfo ? 'max-content' : '0px',
              overflow: 'hidden',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <Flex sx={{ gap: '6px', width: '100%' }}>
              {[1, 1.5, 2, 3].map(item => {
                const isSelected = !customGasUsd && multiplier === item
                return (
                  <Box
                    key={item}
                    onClick={() => {
                      setCustomGasUsd('')
                      setMultiplier(item)
                    }}
                    sx={{
                      borderRadius: '999px',
                      border: `1px solid ${isSelected ? theme.primary : theme.border}`,
                      backgroundColor: isSelected ? theme.primary + '20' : 'transparent',
                      padding: '6px 4px',
                      color: isSelected ? theme.primary : theme.subText,
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textAlign: 'center',
                      flex: 1,
                      '&:hover': {
                        backgroundColor: theme.primary + '10',
                      },
                    }}
                  >
                    ${(item * (feeInfo?.gas.usd || 0)).toFixed(2)}
                  </Box>
                )
              })}

              {/* Custom option */}
              <Box
                key="custom"
                sx={{
                  borderRadius: '999px',
                  border: `1px solid ${customGasUsd ? theme.primary : theme.border}`,
                  backgroundColor: customGasUsd ? theme.primary + '20' : 'transparent',
                  padding: '2px 10px',
                  color: customGasUsd ? theme.primary : theme.subText,
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  '&:hover': {
                    backgroundColor: theme.primary + '10',
                  },
                }}
              >
                <Text as="span" color="inherit" fontSize={12}>
                  $
                </Text>
                <Input
                  value={customGasUsd}
                  onUserInput={v => setCustomGasUsd(v)}
                  placeholder={t`Custom`}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    fontSize: '12px',
                  }}
                />
              </Box>
            </Flex>
            <Flex flexDirection="column" sx={{ gap: '4px' }}>
              <Text fontSize={12} color={theme.subText}>
                {t`Current est. gas`} = ${(feeInfo?.gas.usd || 0).toFixed(2)}
              </Text>
              <Text fontSize={12} color={isWarningGas ? rgba(theme.warning, 0.9) : theme.subText}>
                <Trans>
                  The buffer amount is recommended. The order will{' '}
                  <Text as="span" fontWeight={600}>
                    not execute
                  </Text>{' '}
                  if the actual cost exceeds this.
                </Trans>
              </Text>
              <Text fontSize={12} color={isWarningGas ? rgba(theme.warning, 0.9) : theme.subText} fontWeight={600}>
                <Trans>The actual gas cost will be deducted from your outputs when the order executes.</Trans>
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Content>

      <Flex sx={{ gap: '20px' }} mt="20px" justifyContent="center">
        <ButtonOutlined onClick={onDismiss} width="188px">
          <Text fontSize={14} lineHeight="20px">
            <Trans>Cancel</Trans>
          </Text>
        </ButtonOutlined>
        <ButtonPrimary
          width="188px"
          disabled={disableBtn || !feeInfo}
          onClick={() => {
            if (!disableBtn && feeInfo) setShowConfirm(true)
          }}
        >
          <Text fontSize={14} lineHeight="20px">
            {feeLoading ? t`Estimating fee...` : t`Preview`}
          </Text>
        </ButtonPrimary>
      </Flex>
    </>
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} width="100vw" maxWidth={showConfirm ? '450px' : '800px'}>
      <Flex width="100%" flexDirection="column" padding="20px">
        {showConfirm ? (
          <Confirmation
            selectedMetrics={selectedMetrics.filter(Boolean) as Metric[]}
            timeCondition={timeCondition}
            priceCondition={priceCondition}
            feeYieldCondition={feeYieldCondition}
            onDismiss={() => setShowConfirm(false)}
            conditionType={conditionType}
            deadline={deadline}
            pos={position}
            feeSettings={{
              protocolFee: feeInfo?.protocol.percentage || 0,
              maxFeesPercentage:
                (feeInfo?.gas.percentage || 0) *
                  (customGasUsd ? parseFloat(customGasUsd) / (feeInfo?.gas.usd ?? 0) : multiplier) +
                (feeInfo?.protocol.percentage || 0),
            }}
          />
        ) : (
          setupContent
        )}
      </Flex>
    </Modal>
  )
}
