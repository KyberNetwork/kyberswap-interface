import React, { useState, useRef, useEffect, useMemo } from 'react'
import Modal from 'components/Modal'
import { Flex, Text } from 'rebass'
import { Trans } from '@lingui/macro'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { X } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { useProMMFarms, useFarmAction } from 'state/farms/promm/hooks'
import { useActiveWeb3React } from 'hooks'
import { useProAmmPositions } from 'hooks/useProAmmPositions'
import { Position } from '@vutien/dmm-v3-sdk'
import LocalLoader from 'components/LocalLoader'
import { PositionDetails } from 'types/position'
import { useToken } from 'hooks/Tokens'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { usePool } from 'hooks/usePools'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import RangeBadge from 'components/Badge/RangeBadge'
import { BigNumber } from 'ethers'
import { useTokensPrice } from 'state/application/hooks'
import { formatDollarAmount } from 'utils/numbers'
import { ModalContentWrapper, Checkbox, TableHeader, TableRow, Title } from './styled'

const PositionRow = ({
  position,
  onChange,
  selected,
}: {
  selected: boolean
  position: PositionDetails
  onChange: (value: boolean) => void
}) => {
  const { token0: token0Address, token1: token1Address, fee: feeAmount, liquidity, tickLower, tickUpper } = position

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const usdPrices = useTokensPrice([token0 || undefined, token1 || undefined], 'promm')

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const positionSDK = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const removed = BigNumber.from(position.liquidity.toString()).eq(0)
  const outOfRange =
    positionSDK &&
    (positionSDK.pool.tickCurrent < position.tickLower || positionSDK.pool.tickCurrent > position.tickUpper)

  const usd =
    (usdPrices?.[0] || 0) * parseFloat(positionSDK?.amount0.toExact() || '0') +
    (usdPrices?.[1] || 0) * parseFloat(positionSDK?.amount1.toExact() || '0')

  return (
    <TableRow>
      <Checkbox
        type="checkbox"
        onChange={e => {
          onChange(e.currentTarget.checked)
        }}
        checked={selected}
      />
      <Flex alignItems="center">
        <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} />
        <Text>{position.tokenId.toString()}</Text>
      </Flex>
      <Text>{formatDollarAmount(usd)}</Text>
      <Flex justifyContent="flex-end" sx={{ gap: '4px' }} alignItems="center">
        {positionSDK?.amount0.toSignificant(6)}
        <CurrencyLogo size="16px" currency={currency0} />
      </Flex>

      <Flex justifyContent="flex-end" sx={{ gap: '4px' }} alignItems="center">
        {positionSDK?.amount1.toSignificant(6)}
        <CurrencyLogo size="16px" currency={currency1} />
      </Flex>

      <Flex justifyContent="flex-end">
        <RangeBadge removed={removed} inRange={!outOfRange} />
      </Flex>
    </TableRow>
  )
}

function ProMMDepositNFTModal({
  selectedFarmAddress,
  onDismiss,
}: {
  onDismiss: () => void
  selectedFarmAddress: string
}) {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const checkboxGroupRef = useRef<any>()
  const { data: farms } = useProMMFarms()
  const selectedFarm = farms[selectedFarmAddress || '']
  const poolAddresses = selectedFarm?.map(farm => farm.poolAddress.toLowerCase())
  const [selectedNFTs, setSeletedNFTs] = useState<string[]>([])

  const { deposit } = useFarmAction(selectedFarmAddress)

  const { positions, loading: positionsLoading } = useProAmmPositions(account)

  const eligiblePositions = useMemo(() => {
    return positions?.filter(pos => poolAddresses?.includes(pos.poolId.toLowerCase()))
  }, [positions, poolAddresses])

  useEffect(() => {
    if (!checkboxGroupRef.current) return
    if (selectedNFTs.length === 0) {
      checkboxGroupRef.current.checked = false
      checkboxGroupRef.current.indeterminate = false
    } else if (
      selectedNFTs.length > 0 &&
      eligiblePositions?.length &&
      selectedNFTs.length < eligiblePositions?.length
    ) {
      checkboxGroupRef.current.checked = false
      checkboxGroupRef.current.indeterminate = true
    } else {
      checkboxGroupRef.current.checked = true
      checkboxGroupRef.current.indeterminate = false
    }
  }, [selectedNFTs.length, eligiblePositions])

  if (!selectedFarmAddress) return null

  const handleDeposit = async () => {
    await deposit(selectedNFTs.map(item => BigNumber.from(item)))
    onDismiss()
  }

  return (
    <Modal isOpen={!!selectedFarm} onDismiss={onDismiss} maxHeight={80} maxWidth="808px">
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Title>
            <Trans>Deposit your liquidity</Trans>
          </Title>

          <Flex sx={{ gap: '12px' }}>
            <ButtonEmpty onClick={onDismiss} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>
        </Flex>

        <Text fontSize="12px" marginTop="20px" color={theme.subText} fontStyle="italic">
          <Trans>
            Deposit your liquidity first to enable farming. Only your in range liquidity positions will earn you farming
            rewards earn rewards
          </Trans>
        </Text>

        <TableHeader>
          <Checkbox
            type="checkbox"
            ref={checkboxGroupRef}
            onChange={e => {
              if (e.currentTarget.checked) {
                setSeletedNFTs(eligiblePositions?.map(pos => pos.tokenId.toString()) || [])
              } else {
                setSeletedNFTs([])
              }
            }}
          />
          <Text textAlign="left">ID</Text>
          <Text textAlign="left">
            <Trans>Your liquidity</Trans>
          </Text>
          <Text textAlign="right">Token 1</Text>
          <Text textAlign="right">Token 2</Text>
          <Text textAlign="right">Status</Text>
        </TableHeader>

        {positionsLoading ? (
          <LocalLoader />
        ) : !eligiblePositions?.length ? (
          <Flex alignItems="center" justifyContent="center" padding="16px" color={theme.subText} marginTop="20px">
            <Text fontSize={14}>
              <Trans>Please add more liquidity to get NFT positions</Trans>
            </Text>
          </Flex>
        ) : (
          <>
            {eligiblePositions.map(pos => (
              <PositionRow
                selected={selectedNFTs.includes(pos.tokenId.toString())}
                key={pos.tokenId.toString()}
                position={pos}
                onChange={(selected: boolean) => {
                  if (selected) setSeletedNFTs(prev => [...prev, pos.tokenId.toString()])
                  else {
                    setSeletedNFTs(prev => prev.filter(item => item !== pos.tokenId.toString()))
                  }
                }}
              />
            ))}
            <Flex justifyContent="space-between" marginTop="24px">
              <div></div>
              <ButtonPrimary
                fontSize="14px"
                padding="10px 24px"
                width="fit-content"
                onClick={handleDeposit}
                disabled={!selectedNFTs.length}
              >
                <Trans>Deposit Selected</Trans>
              </ButtonPrimary>
            </Flex>
          </>
        )}
      </ModalContentWrapper>
    </Modal>
  )
}

export default ProMMDepositNFTModal
