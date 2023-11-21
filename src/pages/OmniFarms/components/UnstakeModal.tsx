import { CurrencyAmount, Percent } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import { NormalizedFarm } from 'services/knprotocol'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { NotificationType } from 'components/Announcement/type'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import CheckBox from 'components/CheckBox'
import CurrencyLogo from 'components/CurrencyLogo'
import Dots from 'components/Dots'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Modal from 'components/Modal'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerReadingContract, useProMMFarmSigningContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useFarmAction } from 'state/farms/elastic/hooks'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ButtonText, ExternalLink } from 'theme'
import { calculateGasMargin } from 'utils'
import { friendlyError } from 'utils/errorMessage'
import { formatDisplayNumber } from 'utils/numbers'

import {
  ChainLogo,
  FilterGroup,
  FilterItem,
  PositionTable,
  PositionTableHeader,
  PositionTableRow,
  Tag,
} from '../styled'

export default function UnstakeModal({ farm, onDismiss }: { farm: NormalizedFarm; onDismiss: () => void }) {
  const theme = useTheme()
  const addTransactionWithType = useTransactionAdder()
  const notify = useNotify()
  const { chainId, account } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const posManager = useProAmmNFTPositionManagerReadingContract()
  const farmChainId = farm.chain.chainId
  const farmAddress = farm.farmAddress

  const contract = useProMMFarmSigningContract(farmAddress)

  const [checkingAllowance, setCheckingAllowance] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [waitingForConfirm, setWaitingForConfirm] = useState(false)

  const stakedPositions = useMemo(() => farm.positions.filter(pos => pos.stakedLiq !== '0'), [farm])
  const withdrawalPositions = useMemo(
    () => farm.availablePositions.filter(pos => !!pos.depositedPosition && pos.stakedLiq === '0'),
    [farm],
  )

  const [tab, setTab] = useState<'unstake' | 'withdraw'>(() => (stakedPositions.length ? 'unstake' : 'withdraw'))

  const availablePositions = useMemo(
    () => (tab === 'unstake' ? stakedPositions : withdrawalPositions),
    [tab, stakedPositions, withdrawalPositions],
  )

  const [selectedNfts, setSelectedNfts] = useState<string[]>([])
  const checkAllRef = useRef<any>()

  useEffect(() => {
    setSelectedNfts(availablePositions.map(item => item.id))
  }, [tab, availablePositions])

  useEffect(() => {
    if (farmChainId === chainId && posManager && account) {
      setCheckingAllowance(true)
      posManager
        .isApprovedForAll(account, farmAddress)
        .then((res: boolean) => {
          setIsApproved(res)
        })
        .finally(() => setCheckingAllowance(false))
    }
  }, [chainId, farmChainId, posManager, farmAddress, account])

  const { approve } = useFarmAction(farmAddress)
  const [approvalTx, setApprovalTx] = useState('')
  const isApprovalTxPending = useIsTransactionPending(approvalTx)
  const [approving, setApproving] = useState(false) // waiting response from wallet

  useEffect(() => {
    if (!checkAllRef.current) return
    if (selectedNfts.length === 0) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = false
    } else if (selectedNfts.length > 0 && selectedNfts.length < availablePositions.length) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = true
    } else {
      checkAllRef.current.checked = true
      checkAllRef.current.indeterminate = false
    }
  }, [selectedNfts.length, availablePositions])

  return (
    <Modal isOpen onDismiss={onDismiss} maxWidth="800px" width="100vw">
      <Flex width="100%" padding="20px" flexDirection="column" sx={{ gap: '20px' }} backgroundColor={theme.background}>
        <Flex justifyContent="space-between" alignItems="center" width="100%">
          <Flex alignItems="center" sx={{ gap: '8px' }}>
            <Box sx={{ position: 'relative' }}>
              <DoubleCurrencyLogo currency0={farm.token0} currency1={farm.token1} size={24} />
              <ChainLogo src={farm.chain.icon} size={12} />
            </Box>

            <Text fontSize="20px" fontWeight="500">
              {stakedPositions.length ? <Trans>Unstake your liquidity</Trans> : <Trans>Withdraw your liquidity</Trans>}
            </Text>
          </Flex>

          <ButtonText onClick={onDismiss}>
            <X color={theme.text} />
          </ButtonText>
        </Flex>

        <Text color={theme.subText} fontSize="12px" lineHeight="16px">
          <Trans>
            Unstake your liquidity positions (NFT tokens) from the farm. You will no longer earn rewards on these
            positions once unstaked. Read more <ExternalLink href="/TODO">here ↗</ExternalLink>
          </Trans>
        </Text>

        {!!stakedPositions.length && !!withdrawalPositions.length && (
          <FilterGroup>
            <FilterItem active={tab === 'unstake'} onClick={() => setTab('unstake')}>
              <Trans>Unstake</Trans>
            </FilterItem>

            <FilterItem active={tab === 'withdraw'} onClick={() => setTab('withdraw')}>
              <Trans>Withdraw</Trans>
            </FilterItem>
          </FilterGroup>
        )}

        <PositionTable>
          <PositionTableHeader>
            <Text display="flex" alignItems="center" sx={{ gap: '6px' }}>
              <CheckBox
                disabled={false}
                ref={checkAllRef}
                onChange={e => {
                  if (e.currentTarget.checked) {
                    setSelectedNfts(availablePositions.map(item => item.id))
                  } else {
                    setSelectedNfts([])
                  }
                }}
              />
              ID
            </Text>
            <Text textAlign="right">
              <Trans>AVAILABLE BALANCE</Trans>
            </Text>
            <Text textAlign="right">
              <Trans>STAKED BALANCE</Trans>
            </Text>
            <Text textAlign="right">
              <Trans>PRICE RANGE</Trans>
            </Text>
          </PositionTableHeader>

          {availablePositions.map(pos => {
            const stakedPercent = new Percent(pos.stakedLiq, pos.liquidity)
            const amount0 = CurrencyAmount.fromRawAmount(farm.token0, pos.amount0)
            const amount1 = CurrencyAmount.fromRawAmount(farm.token1, pos.amount1)

            const stakedAmount0 = amount0.multiply(stakedPercent)
            const stakedAmount1 = amount1.multiply(stakedPercent)
            const availableAmount0 = amount0.subtract(stakedAmount0)
            const availableAmount1 = amount1.subtract(stakedAmount1)

            return (
              <PositionTableRow key={pos.id}>
                <Text display="flex" alignItems="center" sx={{ gap: '6px' }}>
                  <CheckBox
                    checked={selectedNfts.includes(pos.id)}
                    onChange={e => {
                      const tmp = selectedNfts.filter(item => item !== pos.id)
                      if (e.currentTarget.checked) setSelectedNfts([...tmp, pos.id])
                      else setSelectedNfts(tmp)
                    }}
                  />
                  <Tag color={pos.outOfRange ? theme.warning : theme.primary}>ID {pos.id}</Tag>
                </Text>

                <Flex justifyContent="flex-end">
                  <MouseoverTooltip
                    placement="bottom"
                    width="fit-content"
                    text={
                      <Flex flexDirection="column" sx={{ gap: '8px' }} width="fit-content">
                        <Flex sx={{ gap: '4px' }} alignItems="center">
                          <CurrencyLogo currency={amount0.currency} size="14px" />
                          <Text>
                            {formatDisplayNumber(availableAmount0.toExact(), {
                              style: 'decimal',
                              significantDigits: 6,
                            })}{' '}
                            {amount0.currency.symbol}
                          </Text>
                        </Flex>

                        <Flex sx={{ gap: '4px' }} alignItems="center">
                          <CurrencyLogo currency={amount1.currency} size="14px" />
                          <Text>
                            {formatDisplayNumber(availableAmount1.toExact(), {
                              style: 'decimal',
                              significantDigits: 6,
                            })}{' '}
                            {amount1.currency.symbol}
                          </Text>
                        </Flex>
                      </Flex>
                    }
                  >
                    {formatDisplayNumber(+pos.amountUSD - (+pos.stakedUSD || 0), {
                      style: 'currency',
                      significantDigits: 4,
                    })}
                    <DropdownSVG />
                  </MouseoverTooltip>
                </Flex>

                <Flex justifyContent="flex-end">
                  <MouseoverTooltip
                    placement="bottom"
                    width="fit-content"
                    text={
                      <Flex flexDirection="column" sx={{ gap: '8px' }} width="fit-content">
                        <Flex sx={{ gap: '4px' }} alignItems="center">
                          <CurrencyLogo currency={amount0.currency} size="14px" />
                          <Text>
                            {formatDisplayNumber(stakedAmount0.toExact(), {
                              style: 'decimal',
                              significantDigits: 6,
                            })}{' '}
                            {amount0.currency.symbol}
                          </Text>
                        </Flex>

                        <Flex sx={{ gap: '4px' }} alignItems="center">
                          <CurrencyLogo currency={amount1.currency} size="14px" />
                          <Text>
                            {formatDisplayNumber(stakedAmount1.toExact(), {
                              style: 'decimal',
                              significantDigits: 6,
                            })}{' '}
                            {amount1.currency.symbol}
                          </Text>
                        </Flex>
                      </Flex>
                    }
                  >
                    {formatDisplayNumber(+pos.stakedUSD || 0, { style: 'currency', significantDigits: 4 })}
                    <DropdownSVG />
                  </MouseoverTooltip>
                </Flex>
              </PositionTableRow>
            )
          })}
        </PositionTable>

        <Flex justifyContent="space-between" alignItems="center" fontSize="14px" fontWeight="500">
          <ExternalLink href="/TODO">
            <Trans>Get pool info ↗</Trans>
          </ExternalLink>

          {!account ? (
            <ButtonLight padding="8px 16px" width="max-content" onClick={() => toggleWalletModal()}>
              <Text as="span" width="max-content">
                <Trans>Connect</Trans>
              </Text>
            </ButtonLight>
          ) : farmChainId !== chainId ? (
            <ButtonLight padding="8px 16px" width="max-content" onClick={() => changeNetwork(farmChainId)}>
              <Text as="span" width="max-content">
                <Trans>Switch to {farm.chain.name}</Trans>
              </Text>
            </ButtonLight>
          ) : checkingAllowance ? (
            <ButtonPrimary disabled width="max-content" padding="8px 16px">
              <Dots>Checking Allowance</Dots>
            </ButtonPrimary>
          ) : approving || (approvalTx && isApprovalTxPending) ? (
            <ButtonPrimary disabled width="max-content" padding="8px 16px">
              <Dots>
                <Trans>Approving</Trans>
              </Dots>
            </ButtonPrimary>
          ) : !isApproved ? (
            <ButtonPrimary
              onClick={async () => {
                setApproving(true)
                const tx = await approve()
                if (tx) {
                  setApprovalTx(tx)
                }
                setApproving(false)
              }}
            >
              <Trans>Approve</Trans>
            </ButtonPrimary>
          ) : (
            <ButtonPrimary
              padding="8px 16px"
              width="max-content"
              disabled={!selectedNfts.length || waitingForConfirm}
              onClick={async () => {
                try {
                  if (!contract) return
                  setWaitingForConfirm(true)
                  let hash = ''
                  if (tab === 'withdraw') {
                    const estimateGas = await contract.estimateGas.withdraw(selectedNfts)
                    const tx = await contract.withdraw(selectedNfts, {
                      gasLimit: calculateGasMargin(estimateGas),
                    })
                    hash = tx.hash
                  } else {
                    const liqs = selectedNfts.map(id => {
                      const tmp = availablePositions.find(item => item.id === id)
                      return BigNumber.from(tmp?.stakedLiq || '0').toString()
                    })
                    const estimateGas = await contract.estimateGas.exit(farm.pid, selectedNfts, liqs)
                    const tx = await contract.exit(farm.pid, selectedNfts, liqs, {
                      gasLimit: calculateGasMargin(estimateGas),
                    })
                    hash = tx.hash
                  }

                  addTransactionWithType({
                    hash,
                    type: tab === 'unstake' ? TRANSACTION_TYPE.UNSTAKE : TRANSACTION_TYPE.ELASTIC_WITHDRAW_LIQUIDITY,
                    extraInfo: {
                      pairs: selectedNfts.map(id => ({
                        tokenAddressIn: farm.token0?.wrapped?.address || '',
                        tokenAddressOut: farm.token1?.wrapped?.address || '',
                        tokenSymbolIn: farm.token0?.symbol || '',
                        tokenSymbolOut: farm.token1?.symbol || '',
                        tokenAmountIn: availablePositions.find(item => item.id === id)?.amount0 || '0',
                        tokenAmountOut: availablePositions.find(item => item.id === id)?.amount1 || '0',
                        poolAddress: farm.pool.id,
                        nftId: id,
                      })),
                      contract: farmAddress,
                    },
                  })
                  setWaitingForConfirm(false)
                  onDismiss()
                } catch (error) {
                  setWaitingForConfirm(false)
                  const message = friendlyError(error)
                  notify(
                    {
                      title: tab === 'unstake' ? t`Unstake Farm Error` : t`Withdraw Farm Error`,
                      summary: message,
                      type: NotificationType.ERROR,
                    },
                    8000,
                  )
                }
              }}
            >
              {waitingForConfirm ? (
                <Dots>{tab === 'unstake' ? <Trans>Unstaking</Trans> : <Trans>Withdrawing</Trans>}</Dots>
              ) : tab === 'unstake' ? (
                <Trans>Unstake Selected</Trans>
              ) : (
                <Trans>Withdraw Selected</Trans>
              )}
            </ButtonPrimary>
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}
