import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { ELASTIC_BASE_FEE_UNIT, ZERO_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { useProMMFarmContract } from 'hooks/useContract'
import { Position as SubgraphPosition, config, parsePosition } from 'hooks/useElasticLegacy'
import useTheme from 'hooks/useTheme'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ExternalLink } from 'theme'
import { calculateGasMargin } from 'utils'
import { formatDollarAmount } from 'utils/numbers'

const Wrapper = styled.div`
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 24px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  line-height: 1.5;
  font-size: 14px;
  text-align: center;
  overflow-x: scroll;
`
const OverFlow = styled.div`
  min-width: 860px;
  overflow-x: scroll;
`

const TableHeader = styled.div`
  display: grid;
  font-size: 12px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  grid-template-columns: 1fr 2fr 1fr 1fr;
  font-weight: 500;
  padding: 1rem;
  background: ${({ theme }) => theme.tableHeader};
  color: ${({ theme }) => theme.subText};
  align-items: center;
`
const TableRow = styled(TableHeader)`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 14px;
`

interface FarmPosition extends SubgraphPosition {
  pendingRewards: Array<{ amount: string; token_address: string }>
}

export default function FarmLegacy({
  farmPositions,
  pendingRewards,
  claimInfo,
}: {
  farmPositions: FarmPosition[]
  claimInfo: { address: string; encodedData: string } | null
  pendingRewards: Array<{ amount: string; token_address: string }>
}) {
  const { chainId } = useActiveWeb3React()

  const addresses = [
    ...new Set(
      farmPositions
        .map(item => [item.token0.id, item.token1.id])
        .flat()
        .concat(
          pendingRewards.map(p =>
            p.token_address === ZERO_ADDRESS ? NativeCurrencies[chainId].wrapped.address : p.token_address,
          ),
        ),
    ),
  ]

  const tokenPrices = useTokenPrices(addresses)
  const allTokens = useAllTokens(true)

  const unclaimedUSD = pendingRewards.reduce((total, item) => {
    const address = item.token_address === ZERO_ADDRESS ? NativeCurrencies[chainId].wrapped.address : item.token_address
    const price = tokenPrices[address] || 0
    if (item.token_address === ZERO_ADDRESS) {
      total += +CurrencyAmount.fromRawAmount(NativeCurrencies[chainId], item.amount).toExact() * price
    } else {
      const token = allTokens[address.toLowerCase()]
      if (token) total += +CurrencyAmount.fromRawAmount(token, item.amount).toExact() * price
    }

    return total
  }, 0)

  const theme = useTheme()

  const numberOfPosition = farmPositions.length

  const [showConfirmModal, setShowConfirmModal] = useState<'claim' | 'withdraw' | null>(null)
  const [txHash, setTxHash] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [attemptingTxn, setAttemptingTxn] = useState(false)

  const handleDismiss = () => {
    setTxHash('')
    setShowConfirmModal(null)
    setErrorMessage('')
    setAttemptingTxn(false)
  }

  const addTransactionWithType = useTransactionAdder()

  const { library } = useWeb3React()
  const handleClaimRewards = async () => {
    if (library && claimInfo) {
      try {
        setShowConfirmModal('claim')
        setAttemptingTxn(true)
        const gas = await library.getSigner().estimateGas({
          to: claimInfo.address,
          data: claimInfo.encodedData,
        })

        const { hash } = await library.getSigner().sendTransaction({
          to: claimInfo.address,
          data: claimInfo.encodedData,
          gasLimit: calculateGasMargin(gas),
        })

        setAttemptingTxn(false)
        setTxHash(hash || '')

        addTransactionWithType({
          hash,
          type: TRANSACTION_TYPE.CLAIM_REWARD,
          extraInfo: {
            summary: 'farming rewards',
          },
        })
      } catch (e) {
        setAttemptingTxn(false)
        setErrorMessage(e?.message || JSON.stringify(e))
      }
    }
  }

  const farmContract = useProMMFarmContract(config[chainId].farmContract || '')

  const handleWithdraw = async () => {
    setShowConfirmModal('withdraw')
    if (!farmContract) {
      setErrorMessage('No contract found')
      return
    }

    try {
      const nftIds = farmPositions.map(item => item.id)
      const estimateGas = await farmContract.estimateGas.emergencyWithdraw(nftIds)
      const tx = await farmContract.emergencyWithdraw(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      setAttemptingTxn(false)
      setTxHash(tx.hash || '')

      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.ELASTIC_FORCE_WITHDRAW_LIQUIDITY,
        extraInfo: { contract: config[chainId].farmContract },
      })
    } catch (e) {
      setAttemptingTxn(false)
      setErrorMessage(e?.message || JSON.stringify(e))
    }
  }

  return (
    <Wrapper>
      <Text>
        We paused all our Elastic farms on 18 April 2023, 4pm UTC. Information on this can be found in our announcement{' '}
        <ExternalLink href="https://twitter.com/KyberNetwork/status/1648265647858790400?s=20">here</ExternalLink>
      </Text>

      {!!numberOfPosition && claimInfo ? (
        <Text>
          You still have{' '}
          <Text color={theme.warning} as="span">
            {numberOfPosition} liquidity positions
          </Text>{' '}
          and{' '}
          <Text color={theme.warning} as="span">
            {formatDollarAmount(unclaimedUSD)} unclaimed farming rewards
          </Text>{' '}
          that you haven&apos;t withdrawn from the Elastic farms yet. You will first need to withdraw all your liquidity
          positions by clicking on ‘Withdraw Positions’ button before you can claim your reward by clicking the
          &apos;Claim Rewards&apos; button{' '}
        </Text>
      ) : !!numberOfPosition ? (
        <Text>
          You still have{' '}
          <Text as="span" color={theme.warning}>
            {numberOfPosition} liquidity positions
          </Text>{' '}
          that you haven&apos;t withdrawn from the Elastic farms yet, please withdraw and remove your funds on Elastic
          as soon as possible
        </Text>
      ) : (
        <Text>
          You are eligible for{' '}
          <Text as="span" color={theme.warning}>
            {formatDollarAmount(unclaimedUSD)} unclaimed farming rewards
          </Text>
          , you can claim them by clicking the &apos;Claim Rewards&apos; button below.
        </Text>
      )}

      {!!numberOfPosition && (
        <Flex alignItems="center" sx={{ gap: '8px' }} justifyContent="flex-end" marginY="1rem">
          <Text fontSize="12px">Total Rewards</Text>
          <Text fontSize="1rem" fontWeight="500" color={theme.text}>
            {formatDollarAmount(unclaimedUSD)}
          </Text>
        </Flex>
      )}

      <OverFlow>
        {!!numberOfPosition && (
          <TableHeader>
            <Text textAlign="left">NFT ID</Text>
            <Text textAlign="left">FARMS</Text>
            <Text textAlign="left">STAKED LIQUIDITY</Text>
            <Text textAlign="right">REWARD</Text>
          </TableHeader>
        )}

        {farmPositions.map(item => {
          const { token0, token1, position, usd } = parsePosition(item, chainId, tokenPrices)

          const rws = item.pendingRewards.map(item => {
            if (item.token_address === ZERO_ADDRESS)
              return CurrencyAmount.fromRawAmount(NativeCurrencies[chainId], item.amount)
            const token = allTokens[item.token_address.toLowerCase()]
            if (!token) return null
            return CurrencyAmount.fromRawAmount(token, item.amount)
          })

          return (
            <TableRow key={item.id}>
              <Text textAlign="left" color={theme.subText}>
                {item.id}
              </Text>
              <Flex alignItems="center">
                <DoubleCurrencyLogo currency0={token0} currency1={token1} />
                <Text color={theme.primary}>
                  {token0.symbol} - {token1.symbol}
                </Text>
                <FeeTag>Fee {((Number(item.pool?.feeTier) || 0) * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
              </Flex>
              <Flex alignItems="center" justifyContent="flex-start" width="fit-content">
                <MouseoverTooltip
                  width="fit-content"
                  placement="bottom"
                  text={
                    <Flex flexDirection="column">
                      <Flex sx={{ gap: '4px' }} alignItems="center">
                        <CurrencyLogo currency={position.amount0.currency} size="16px" />
                        <Text fontWeight="500">{position.amount0.toSignificant(6)}</Text>
                        <Text fontWeight="500">{position.amount0.currency.symbol}</Text>
                      </Flex>

                      <Flex sx={{ gap: '4px' }} alignItems="center" marginTop="6px">
                        <CurrencyLogo currency={position.amount1.currency} size="16px" />
                        <Text fontWeight="500">{position.amount1.toSignificant(6)}</Text>
                        <Text fontWeight="500">{position.amount1.currency.symbol}</Text>
                      </Flex>
                    </Flex>
                  }
                >
                  {formatDollarAmount(usd)}
                  <DropdownSvg />
                </MouseoverTooltip>
              </Flex>

              <Flex justifyContent="flex-end" flexDirection="column" sx={{ gap: '8px' }}>
                {!rws.length && <Text textAlign="right">--</Text>}
                {rws.map(
                  (rw, index) =>
                    rw && (
                      <Flex key={index} sx={{ gap: '4px' }} justifyContent="flex-end" alignItems="center">
                        <CurrencyLogo currency={rw.currency} size="14px" />
                        {rw.toSignificant(6)}
                      </Flex>
                    ),
                )}
              </Flex>
            </TableRow>
          )
        })}
      </OverFlow>

      <Flex marginTop="24px" sx={{ gap: '12px' }} justifyContent={numberOfPosition ? 'flex-end' : 'center'}>
        {!!numberOfPosition && (
          <ButtonLight
            onClick={handleWithdraw}
            color={theme.red}
            width="170px"
            padding="8px"
            style={{ border: `1px solid ${theme.red}` }}
          >
            Withdraw Positions
          </ButtonLight>
        )}
        {claimInfo && (
          <ButtonPrimary width="170px" padding="8px" onClick={handleClaimRewards}>
            Claim Rewards
          </ButtonPrimary>
        )}
      </Flex>

      <TransactionConfirmationModal
        isOpen={!!showConfirmModal}
        onDismiss={handleDismiss}
        hash={txHash}
        attemptingTxn={attemptingTxn}
        pendingText={`Claiming Rewards`}
        content={() => (
          <Flex flexDirection={'column'} width="100%">
            {errorMessage ? <TransactionErrorContent onDismiss={handleDismiss} message={errorMessage} /> : null}
          </Flex>
        )}
      />
    </Wrapper>
  )
}
