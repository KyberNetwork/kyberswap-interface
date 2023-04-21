import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Modal from 'components/Modal'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { ELASTIC_BASE_FEE_UNIT, ZERO_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { Snapshot } from 'hooks/useElasticCompensationData'
import useTheme from 'hooks/useTheme'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ExternalLink } from 'theme'
import { calculateGasMargin } from 'utils'
import { formatDollarAmount } from 'utils/numbers'

import { FeeTag } from './ElasticFarmGroup/styleds'

const Wrapper = styled.div`
  line-height: 1.5;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.background};
  padding: 24px;
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  border-radius: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 1rem 0.75rem;
  `}
`
const TableHeader = styled.div`
  display: grid;
  font-size: 12px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  grid-template-columns: 2fr 3fr 3fr;
  font-weight: 500;
  padding: 1rem;
  background: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.subText};
`
const TableRow = styled(TableHeader)`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

export const ElasticCompensation = ({
  onWithdraw,
  data,
  numberOfPosition,
  tokenPrices,
  claimInfo,
}: {
  onWithdraw: () => void
  data: Array<Snapshot> | null
  numberOfPosition: number
  tokenPrices: { [address: string]: number }
  claimInfo: { address: string; encodedData: string } | null
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  const { farms } = useElasticFarms()

  const enrichData = data?.map(item => {
    const pool = farms?.find(f => f.id === item.farm_address)?.pools.find(p => +p.pid === +item.pid)
    return {
      ...item,
      pending_rewards: item.pending_rewards.map(rw => {
        const rwToken =
          rw.token_address === ZERO_ADDRESS
            ? NativeCurrencies[chainId]
            : pool?.rewardTokens.find(token => token.wrapped.address.toLowerCase() === rw.token_address)
        return {
          amount: rw.amount,
          token: rwToken,
        }
      }),
      pool,
    }
  })

  const unclaimedUSD = enrichData?.reduce((total, item) => {
    const usd = item.pending_rewards.reduce((acc, cur) => {
      if (!cur.token) return acc
      const amount = CurrencyAmount.fromRawAmount(cur.token, cur.amount)
      return acc + (+amount.toExact() || 0) * (tokenPrices[cur.token.wrapped.address] || 0)
    }, 0)
    return total + usd
  }, 0)

  const addTransactionWithType = useTransactionAdder()

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [attemptingTxn, setAttemptingTxn] = useState(false)

  const handleDismiss = () => {
    txHash && setIsOpen(false)
    setTxHash('')
    setShowConfirmModal(false)
    setErrorMessage('')
    setAttemptingTxn(false)
  }

  const handleClaimRewards = async () => {
    if (library && claimInfo) {
      try {
        setShowConfirmModal(true)
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

  return (
    <>
      <Wrapper>
        <Text>
          We paused all our Elastic farms on 18 April 2023, 4pm UTC. Information on this can be found in our
          announcement{' '}
          <ExternalLink href="https://twitter.com/KyberNetwork/status/1648265647858790400?s=20">here</ExternalLink>
        </Text>
        {!!numberOfPosition && data ? (
          <Text>
            You still have{' '}
            <Text color={theme.warning} as="span">
              {numberOfPosition} liquidity positions
            </Text>{' '}
            and{' '}
            <Text color={theme.warning} as="span">
              {formatDollarAmount(unclaimedUSD)} unclaimed farming rewards
            </Text>{' '}
            that you haven&apos;t withdrawn from the Elastic farms yet. You will first need to withdraw all your
            liquidity positions by clicking on ‘Withdraw Positions’ button before you can claim your reward by clicking
            the &apos;Claim Rewards&apos; button{' '}
          </Text>
        ) : !!numberOfPosition ? (
          <Text>
            You still have{' '}
            <Text as="span" color={theme.warning}>
              {numberOfPosition} liquidity positions
            </Text>
            , please withdraw and remove your funds on Elastic as soon as possible
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

        <Flex marginTop="36px" sx={{ gap: '12px' }} justifyContent="center">
          {!!numberOfPosition && (
            <ButtonLight
              onClick={onWithdraw}
              color={theme.red}
              width="fit-content"
              minWidth="160px"
              padding="8px"
              style={{ border: `1px solid ${theme.red}` }}
            >
              Withdraw Positions
            </ButtonLight>
          )}
          <ButtonPrimary width="fit-content" minWidth="160px" padding="8px" onClick={() => setIsOpen(true)}>
            Claim Rewards
          </ButtonPrimary>
        </Flex>
      </Wrapper>
      <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} width="800px" maxWidth="100vw" maxHeight={80}>
        <Flex
          width="100%"
          padding="20px"
          flexDirection="column"
          sx={{ gap: '1rem' }}
          backgroundColor={theme.background}
        >
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontWeight="500" fontSize="20px">
              Your Unclaimed Rewards
            </Text>
            <X style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} size={20} />
          </Flex>
          <Flex justifyContent="space-between" alignItems="center" sx={{ gap: '12px' }} color={theme.subText}>
            <Text fontSize="12px">Here you can claim all your leftover reward from our previous farms</Text>
            <Flex alignItems="center" sx={{ gap: '8px' }}>
              <Text fontSize="12px">Total Rewards</Text>
              <Text fontSize="1rem" fontWeight="500" color={theme.text}>
                {formatDollarAmount(unclaimedUSD)}
              </Text>
            </Flex>
          </Flex>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            <TableHeader>
              <Text>NFT ID</Text>
              <Text>FARMS</Text>
              <Text textAlign="right">REWARD</Text>
            </TableHeader>
            {enrichData?.map(item => {
              return (
                <TableRow key={item.nftid}>
                  <Text>{item.nftid}</Text>
                  <Flex alignItems="center">
                    <DoubleCurrencyLogo currency0={item.pool?.token0} currency1={item.pool?.token1} />
                    <Text color={theme.primary}>
                      {item.pool?.token0.symbol} - {item.pool?.token1.symbol}
                    </Text>
                    <FeeTag>Fee {((item.pool?.pool.fee || 0) * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
                  </Flex>
                  <Flex justifyContent="flex-end" flexDirection="column" sx={{ gap: '8px' }}>
                    {item.pending_rewards.map((rw, index) => (
                      <Flex key={index} sx={{ gap: '4px' }} justifyContent="flex-end" alignItems="center">
                        <CurrencyLogo currency={rw.token} size="14px" />
                        {rw.token && CurrencyAmount.fromRawAmount(rw.token, rw.amount).toSignificant(6)}
                      </Flex>
                    ))}
                  </Flex>
                </TableRow>
              )
            })}
          </div>

          <Flex justifyContent="flex-end">
            <ButtonPrimary width="fit-content" minWidth="160px" padding="8px" onClick={handleClaimRewards}>
              Claim Rewards
            </ButtonPrimary>
          </Flex>
        </Flex>
      </Modal>
      <TransactionConfirmationModal
        isOpen={showConfirmModal}
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
    </>
  )
}
