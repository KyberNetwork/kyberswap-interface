import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import Modal from 'components/Modal'
import TokenLogo from 'components/TokenLogo'
import { TIMES_IN_SECS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import { RevertIconWrapper } from 'pages/Earns/PositionDetail/styles'
import PriceRange from 'pages/Earns/UserPositions/PriceRange'
import { PositionValueWrapper } from 'pages/Earns/UserPositions/styles'
import { ParsedPosition } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

import { Confirmation } from './Confirmation'
import { Metric, Metrics } from './Metrics'

const Content = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: row;
  gap: 20px;
`

const Box = styled.div`
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
          <Box>
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
          </Box>

          <Box>
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
                <Trans>Earning Fee Yield</Trans> <InfoHelper text="TODO" />{' '}
              </Text>
              <Text>TODO</Text>
            </Flex>
          </Box>
        </Flex>

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
      </Content>
      <Flex sx={{ gap: '20px' }} mt="20px" justifyContent="center">
        <ButtonOutlined onClick={onDismiss} width="188px">
          <Text fontSize={14} lineHeight="20px">
            <Trans>Cancel</Trans>
          </Text>
        </ButtonOutlined>
        <ButtonPrimary
          width="188px"
          disabled={disableBtn}
          onClick={() => {
            if (!disableBtn) setShowConfirm(true)
          }}
        >
          <Text fontSize={14} lineHeight="20px">
            <Trans>Preview</Trans>
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
            expireTime={expireTime}
            pos={position}
          />
        ) : (
          setupContent
        )}
      </Flex>
    </Modal>
  )
}
