import React, { useState, useRef, useEffect, useMemo } from 'react'
import Modal from 'components/Modal'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { Trans, t } from '@lingui/macro'
import { MouseoverTooltip } from 'components/Tooltip'
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
import { useIsTransactionPending } from 'state/transactions/hooks'
import { Dots } from 'components/swap/styleds'

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 20px;
  background-color: ${({ theme }) => theme.background};
`

const Title = styled(Text)<{ border?: boolean }>`
  font-size: 20px;
  line-height: 32px;
  font-weight: 500;
  border-bottom: 0.5px dashed ${({ theme, border }) => (border ? theme.subText : 'transparent')};
`

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 18px 90px 1.5fr repeat(3, 1fr);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background: ${({ theme }) => theme.tableHeader};
  gap: 16px;
  font-size: 12px;
  text-transform: uppercase;
  margin-top: 20px;
  padding: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  align-items: center;
`

const TableRow = styled(TableHeader)`
  background: ${({ theme }) => theme.background};
  boder-radius: 0;
  text-transform: none;
  margin-top: 0;
  font-weight: 400;
  color: ${({ theme }) => theme.text};

  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const Checkbox = styled.input`
  position: relative;
  transform: scale(1.35);
  accent-color: ${({ theme }) => theme.primary};

  :indeterminate::before {
    content: '';
    display: block;
    color: white;
    width: 13px;
    height: 13px;
    background-color: ${({ theme }) => theme.primary};
    border-radius: 2px;
  }
  :indeterminate::after {
    content: '';
    display: block;
    width: 7px;
    height: 7px;
    border: solid white;
    border-width: 2px 0 0 0;
    position: absolute;
    top: 5.5px;
    left: 3px;
  }
`
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

function ProMMDepositWithdrawNFTModal({
  selectedFarmAddress,
  type,
  onDismiss,
}: {
  type: 'deposit' | 'withdraw' | null
  onDismiss: () => void
  selectedFarmAddress: string
}) {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const checkboxGroupRef = useRef<any>()
  const { data: farms } = useProMMFarms()
  const selectedFarm = farms[selectedFarmAddress || '']
  const poolAddresses = selectedFarm?.map(farm => farm.pAddress.toLowerCase())
  const [selectedNFTs, setSeletedNFTs] = useState<string[]>([])

  const { deposit, approve, isApprovedForAll } = useFarmAction(selectedFarmAddress)

  const { positions, loading: positionsLoading } = useProAmmPositions(account)

  const eligiblePositions = positions?.filter(pos => poolAddresses?.includes(pos.poolId.toLowerCase()))

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
  }, [selectedNFTs.length, eligiblePositions?.length])

  const [approvalTx, setApprovalTx] = useState('')
  const isApprovalTxPending = useIsTransactionPending(approvalTx)

  // if (checkboxGroupRef.current) checkboxGroupRef.current.indeterminate = true
  if (!selectedFarmAddress) return null

  const handleDeposit = async () => {
    if (!isApprovedForAll) {
      const tx = await approve()
      setApprovalTx(tx)
    } else {
      await deposit(selectedNFTs.map(item => BigNumber.from(item)))
      onDismiss()
    }
  }

  return (
    <Modal isOpen={!!type} onDismiss={onDismiss} maxHeight={80} maxWidth="808px">
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Title border={type === 'deposit'}>
            {type === 'deposit' ? (
              <MouseoverTooltip
                text={t`Deposit your liquidity first to enable farming. Only your in range liquidity positions will earn you farming rewards`}
              >
                <Trans>Deposit your liquidity</Trans>
              </MouseoverTooltip>
            ) : (
              <Trans>Withdraw your liquidity</Trans>
            )}
          </Title>

          <Flex sx={{ gap: '12px' }}>
            <ButtonEmpty onClick={onDismiss} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>
        </Flex>

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
          <Text>No nft</Text>
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
                disabled={isApprovedForAll ? !selectedNFTs.length : isApprovalTxPending}
              >
                {!isApprovedForAll ? (
                  approvalTx && isApprovalTxPending ? (
                    <Dots>
                      <Trans>Approving</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve</Trans>
                  )
                ) : (
                  <Trans>Deposit Selected</Trans>
                )}
              </ButtonPrimary>
            </Flex>
          </>
        )}
      </ModalContentWrapper>
    </Modal>
  )
}

export default ProMMDepositWithdrawNFTModal
