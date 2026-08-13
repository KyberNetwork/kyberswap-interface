import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { type ButtonHTMLAttributes, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Repeat, X } from 'react-feather'
import { Link } from 'react-router-dom'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import ExpandableBox from 'components/ExpandableBox'
import HistoryIcon from 'components/Icons/History'
import VoteIcon from 'components/Icons/Vote'
import Wallet from 'components/Icons/Wallet'
import WarningIcon from 'components/Icons/WarningIcon'
import InfoHelper from 'components/InfoHelper'
import NumericalInput from 'components/NumericalInput'
import Row, { AutoRow, RowBetween, RowFit } from 'components/Row'
import { HStack, Stack } from 'components/Stack'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
import {
  useKyberDAOInfo,
  useKyberDaoStakeActions,
  useRefetchGasRefundInfo,
  useStakingInfo,
  useVotingInfo,
} from 'hooks/kyberdao'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import DelegateConfirmModal from 'pages/KyberDAO/StakeKNC/DelegateConfirmModal'
import MigrateModal from 'pages/KyberDAO/StakeKNC/MigrateModal'
import { useSwitchToEthereum } from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'
import YourTransactionsModal from 'pages/KyberDAO/StakeKNC/YourTransactionsModal'
import KNCLogo from 'pages/KyberDAO/kncLogo'
import { ApplicationModal } from 'state/application/actions'
import { useKNCPrice, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { isAddress, shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'
import { formatUnits, parseUnits } from 'utils/viem'

enum STAKE_TAB {
  Stake = 'Stake',
  Unstake = 'Unstake',
  Delegate = 'Delegate',
}

export const SmallButton = ({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'cursor-pointer rounded-lg border-none bg-tableHeader px-2 py-1 text-xs text-subText transition-all duration-100 ease-in-out hover:brightness-105 active:brightness-110',
      className,
    )}
    {...props}
  />
)

export const KNCLogoWrapper = ({ children, className }: { children: ReactNode; className?: string }) => (
  <HStack
    className={cn(
      'items-center gap-2 rounded-full bg-background py-2 pl-2 pr-3 text-base font-medium text-subText',
      className,
    )}
  >
    {children}
  </HStack>
)

export default function StakeKNCComponent() {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const kyberDAOInfo = useKyberDAOInfo()
  const { stakedBalance, KNCBalance, delegatedAddress } = useStakingInfo()
  const { calculateVotingPower } = useVotingInfo()
  const isDelegated = !!delegatedAddress && delegatedAddress !== account
  const { stake, unstake, delegate, undelegate } = useKyberDaoStakeActions()
  const [activeTab, setActiveTab] = useState(STAKE_TAB.Stake)
  const [delegateAddress, setDelegateAddress] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [pendingText, setPendingText] = useState<string>('')
  const [txHash, setTxHash] = useState<string | undefined>(undefined)
  const [inputValue, setInputValue] = useState('1')
  const [transactionError, setTransactionError] = useState<string | undefined>()

  const isUndelegate = useRef(false)

  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  useEffect(() => {
    if (![ChainId.MAINNET, ChainId.GÖRLI].includes(chainId)) {
      setErrorMessage(undefined)
      return
    }
    // Check if too many decimals
    try {
      parseUnits(inputValue, 18)
    } catch {
      setErrorMessage(t`Invalid amount`)
      return
    }
    if (!inputValue || isNaN(parseFloat(inputValue)) || parseFloat(inputValue) <= 0) {
      setErrorMessage(t`Invalid amount`)
    } else if (
      (parseUnits(inputValue, 18) > BigInt((KNCBalance || 0).toString()) && activeTab === STAKE_TAB.Stake) ||
      (parseUnits(inputValue, 18) > BigInt((stakedBalance || 0).toString()) && activeTab === STAKE_TAB.Unstake)
    ) {
      setErrorMessage(t`Insufficient amount`)
    } else if (activeTab === STAKE_TAB.Delegate && !isAddress(chainId, delegateAddress)) {
      setErrorMessage(t`Invalid Ethereum address`)
    } else if (activeTab === STAKE_TAB.Delegate && delegateAddress.toLowerCase() === account?.toLowerCase()) {
      setErrorMessage(t`Cannot delegate to your wallet address`)
    } else if (activeTab === STAKE_TAB.Delegate && delegateAddress.toLowerCase() === delegatedAddress?.toLowerCase()) {
      setErrorMessage(t`You already delegated to this address`)
    } else {
      setErrorMessage(undefined)
    }
  }, [
    chainId,
    inputValue,
    KNCBalance,
    stakedBalance,
    activeTab,
    delegateAddress,
    account,
    isDelegated,
    delegatedAddress,
  ])

  const toggleWalletModal = useWalletModalToggle()
  const toggleDelegateConfirm = useToggleModal(ApplicationModal.DELEGATE_CONFIRM)
  const toggleYourTransactions = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const { switchToEthereum } = useSwitchToEthereum()
  const { trackingHandler } = useTracking()
  const kncToken = useMemo(
    () =>
      new Token(chainId === ChainId.GÖRLI ? ChainId.GÖRLI : ChainId.MAINNET, kyberDAOInfo?.KNCAddress || '', 18, 'KNC'),
    [chainId, kyberDAOInfo?.KNCAddress],
  )
  const parsedAmount = useParsedAmount(kncToken, inputValue)

  const [approvalKNC, approveCallback] = useApproveCallback({
    amount: activeTab === STAKE_TAB.Stake && inputValue ? parsedAmount : undefined,
    spender: kyberDAOInfo?.staking,
  })

  const stakedBalanceFormatted = formatUnits(BigInt((stakedBalance || 0).toString()), 18)
  const currentVotingPower = calculateVotingPower(stakedBalanceFormatted)
  const newVotingPower = parseFloat(
    calculateVotingPower(stakedBalanceFormatted, (activeTab === STAKE_TAB.Unstake ? '-' : '') + inputValue),
  )
  const deltaVotingPower = Math.abs(newVotingPower - parseFloat(currentVotingPower)).toPrecision(3)
  const refetchGasRefundInfo = useRefetchGasRefundInfo()

  const handleStake = async () => {
    try {
      await switchToEthereum(t`Staking KNC`)
    } catch {
      return
    }

    setPendingText(t`Staking ${inputValue} KNC to KyberDAO`)
    setShowConfirm(true)
    setAttemptingTxn(true)
    trackingHandler(TRACKING_EVENT_TYPE.KYBER_DAO_STAKE_CLICK, { amount: inputValue })
    stake(parseUnits(inputValue, 18), deltaVotingPower)
      .then(tx => {
        setAttemptingTxn(false)
        setTxHash(tx)
        refetchGasRefundInfo()
      })
      .catch(error => {
        setAttemptingTxn(false)
        setTxHash(undefined)
        setTransactionError(error?.message)
      })
  }

  const handleUnstake = async () => {
    try {
      await switchToEthereum(t`Unstaking KNC`)
    } catch {
      return
    }

    setPendingText(t`Unstaking ${inputValue} KNC from KyberDAO`)
    setShowConfirm(true)
    setAttemptingTxn(true)
    trackingHandler(TRACKING_EVENT_TYPE.KYBER_DAO_UNSTAKE_CLICK, { amount: inputValue })
    unstake(parseUnits(inputValue, 18))
      .then(tx => {
        setAttemptingTxn(false)
        setTxHash(tx)
        refetchGasRefundInfo()
      })
      .catch(error => {
        setAttemptingTxn(false)
        setTransactionError(error?.message)
      })
  }

  const handleDelegate = async () => {
    try {
      await switchToEthereum(t`Delegate`)
    } catch {
      return
    }

    isUndelegate.current = false
    toggleDelegateConfirm()
  }

  const handleUndelegate = async () => {
    try {
      await switchToEthereum(t`Undelegate`)
    } catch {
      return
    }

    isUndelegate.current = true
    toggleDelegateConfirm()
  }

  const onDelegateConfirmed = useCallback(() => {
    if (!account) return
    if (isUndelegate.current) {
      setPendingText(t`You are undelegating your voting from ${delegatedAddress}.`)
      setShowConfirm(true)
      setAttemptingTxn(true)
      undelegate(account)
        .then(tx => {
          setAttemptingTxn(false)
          setTxHash(tx)
          setDelegateAddress('')
          refetchGasRefundInfo()
        })
        .catch(error => {
          setAttemptingTxn(false)
          setTransactionError(error?.message)
        })
    } else {
      setPendingText(t`You are delegating your voting power to ${delegateAddress}.`)
      setShowConfirm(true)
      setAttemptingTxn(true)
      trackingHandler(TRACKING_EVENT_TYPE.KYBER_DAO_DELEGATE_CLICK, { delegateAddress: delegateAddress })
      delegate(delegateAddress)
        .then(tx => {
          setAttemptingTxn(false)
          setTxHash(tx)
          setDelegateAddress('')
          refetchGasRefundInfo()
        })
        .catch(error => {
          setAttemptingTxn(false)
          setTransactionError(error?.message)
        })
    }
    toggleDelegateConfirm()
  }, [
    delegate,
    delegateAddress,
    account,
    delegatedAddress,
    toggleDelegateConfirm,
    undelegate,
    trackingHandler,
    refetchGasRefundInfo,
  ])

  const kncPrice = useKNCPrice()
  const kncValueInUsd = useMemo(() => {
    if (!kncPrice || !inputValue) return 0
    return (kncPrice * parseFloat(inputValue)).toFixed(2)
  }, [kncPrice, inputValue])

  const handleMaxClick = useCallback(
    (half?: boolean) => {
      const balance = (activeTab === STAKE_TAB.Stake ? KNCBalance : stakedBalance) as bigint
      setInputValue(formatUnits(balance / (half ? 2n : 1n), 18))
    },
    [activeTab, KNCBalance, stakedBalance],
  )

  // Reset input value on tab changes
  useEffect(() => {
    setInputValue('1')
  }, [activeTab])

  return (
    <Stack className="w-full gap-4">
      <HStack className="items-center gap-8 max-xs:justify-between">
        {Object.keys(STAKE_TAB).map((tab: string) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as STAKE_TAB)}
            className={cn(
              'cursor-pointer border-none bg-transparent text-base font-medium hover:brightness-110',
              activeTab === tab ? 'text-primary' : 'text-subText',
            )}
          >
            {tab}
          </button>
        ))}
      </HStack>

      <HStack className="w-full items-center justify-between gap-4 rounded-2xl bg-background p-4">
        <span className="text-sm font-medium text-subText">
          <Trans>Your Staked KNC</Trans>
        </span>
        <HStack className="items-center gap-2 text-base text-text">
          <KNCLogo size={20} /> {stakedBalanceFormatted} KNC
        </HStack>
      </HStack>

      <Stack className="w-full gap-4 rounded-2xl bg-background p-4">
        <RowBetween className="text-subText">
          <Link to="/swap/ethereum/eth-to-knc" className="flex items-center justify-center gap-2 text-subText">
            <Repeat size={16} />
            <span className="text-sm">
              <Trans>Get KNC</Trans>
            </span>
          </Link>
          {account && (
            <RowFit onClick={toggleYourTransactions} className="cursor-pointer justify-end gap-2 hover:brightness-125">
              <HistoryIcon size={18} /> <span className="text-sm">History</span>
            </RowFit>
          )}
        </RowBetween>
        {(activeTab === STAKE_TAB.Stake || activeTab === STAKE_TAB.Unstake) && (
          <>
            <Stack className="gap-2 rounded-2xl bg-buttonBlack px-4 py-3 [filter:drop-shadow(0px_4px_4px_rgba(0,0,0,0.16))]">
              <RowBetween className="w-full">
                <AutoRow className="gap-2">
                  <SmallButton onClick={() => handleMaxClick()}>Max</SmallButton>
                  <SmallButton onClick={() => handleMaxClick(true)}>Half</SmallButton>
                </AutoRow>
                {activeTab === STAKE_TAB.Stake && (
                  <AutoRow className="justify-end gap-2 text-subText">
                    <Wallet />{' '}
                    <span className="text-xs">{KNCBalance ? formatUnits(BigInt(KNCBalance.toString()), 18) : 0}</span>
                  </AutoRow>
                )}
              </RowBetween>
              <HStack className="items-center justify-between gap-2">
                <NumericalInput value={inputValue} onUserInput={setInputValue} />
                <span className="text-sm text-border">~${kncValueInUsd}</span>
                <KNCLogoWrapper>
                  <KNCLogo />
                  KNC
                </KNCLogoWrapper>
              </HStack>
            </Stack>
            {account ? (
              <Row className="gap-4">
                {(approvalKNC === ApprovalState.NOT_APPROVED || approvalKNC === ApprovalState.PENDING) &&
                  activeTab === STAKE_TAB.Stake &&
                  [ChainId.MAINNET, ChainId.GÖRLI].includes(chainId) &&
                  !errorMessage && (
                    <ButtonPrimary onClick={() => approveCallback()} disabled={approvalKNC === ApprovalState.PENDING}>
                      {approvalKNC === ApprovalState.PENDING ? 'Approving...' : 'Approve'}
                    </ButtonPrimary>
                  )}
                {activeTab === STAKE_TAB.Stake ? (
                  <ButtonPrimary
                    disabled={
                      [ChainId.MAINNET, ChainId.GÖRLI].includes(chainId) &&
                      (approvalKNC !== ApprovalState.APPROVED || !!errorMessage)
                    }
                    onClick={() => {
                      handleStake()
                    }}
                  >
                    {errorMessage || t`Stake`}
                  </ButtonPrimary>
                ) : (
                  <ButtonPrimary
                    disabled={[ChainId.MAINNET, ChainId.GÖRLI].includes(chainId) && !!errorMessage}
                    onClick={() => {
                      handleUnstake()
                    }}
                  >
                    {errorMessage || t`Unstake`}
                  </ButtonPrimary>
                )}
              </Row>
            ) : (
              <ButtonLight className="gap-2" onClick={toggleWalletModal}>
                <InfoHelper
                  size={20}
                  fontSize={12}
                  className="text-primary"
                  text={t`Staking KNC is only available on Ethereum chain`}
                  placement="top"
                />
                <Trans>Connect</Trans>
              </ButtonLight>
            )}
          </>
        )}
        {activeTab === STAKE_TAB.Delegate && (
          <>
            <RowBetween>
              <span className="text-xs text-subText">
                <Trans>Delegate Address</Trans>
              </span>
              {isDelegated && (
                <MouseoverTooltip
                  text={t`You have already delegated your voting power to this address.`}
                  placement="top"
                >
                  <HStack className="select-none items-center gap-2 rounded-full bg-tableHeader px-2 py-1 text-xs text-subText shadow-[0px_2px_2px_rgba(0,0,0,0.1)] [&>svg:hover]:brightness-125">
                    <VoteIcon /> {shortenAddress(ChainId.MAINNET, delegatedAddress)}{' '}
                    <X style={{ cursor: 'pointer' }} size={16} onClick={handleUndelegate} />
                  </HStack>
                </MouseoverTooltip>
              )}
            </RowBetween>
            <Stack className="gap-2 rounded-2xl bg-buttonBlack px-4 py-3 [filter:drop-shadow(0px_4px_4px_rgba(0,0,0,0.16))]">
              <input
                className="min-w-0 border-none bg-transparent text-sm text-text outline-none disabled:text-border"
                value={delegateAddress}
                onChange={e => {
                  setDelegateAddress(e.target.value)
                }}
                placeholder="Ethereum Address"
              />
            </Stack>
            <span className="text-xs italic text-subText">
              <Trans>*Only delegate to Ethereum address</Trans>
            </span>
            <ExpandableBox
              borderRadius="16px"
              backgroundColor={theme.buttonBlack}
              padding="16px"
              className="text-subText"
              style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))' }}
              headerContent={
                <HStack className="items-center gap-2">
                  <div className="shrink-0">
                    <WarningIcon />
                  </div>
                  <span className="text-xs text-subText">
                    <Trans>Important Notice: Kyber Network does not hold your funds or manage this process.</Trans>
                  </span>
                </HStack>
              }
              expandContent={
                <p className="px-8 text-xs">
                  <Trans>
                    In this default delegation method, your delegate is responsible for voting on your behalf and
                    distributing your KNC rewards to you, though only you can withdraw/unstake your own KNC
                  </Trans>
                </p>
              }
            />
            {account ? (
              <ButtonPrimary onClick={handleDelegate} disabled={!!errorMessage}>
                {errorMessage || <Trans>Delegate</Trans>}
              </ButtonPrimary>
            ) : (
              <ButtonLight className="gap-2" onClick={toggleWalletModal}>
                <InfoHelper
                  size={20}
                  fontSize={12}
                  className="text-primary"
                  text={t`Delegate is only available on Ethereum chain`}
                  placement="top"
                />
                <Trans>Connect</Trans>
              </ButtonLight>
            )}
          </>
        )}
      </Stack>
      <ExpandableBox
        border={`1px solid ${theme.darkBorder}`}
        backgroundColor={theme.buttonBlack}
        borderRadius="16px"
        className="text-subText"
        padding={'12px 16px'}
        headerContent={
          <span className="text-xs font-semibold uppercase tracking-wide text-text">
            <Trans>Stake Information</Trans>
          </span>
        }
        expandContent={
          <Stack className="gap-2 text-xs">
            <RowBetween>
              <span>
                <Trans>Stake Amount</Trans>
              </span>
              <span>
                {stakedBalanceFormatted} KNC
                {activeTab !== STAKE_TAB.Delegate && (
                  <>
                    {' '}
                    &rarr;{' '}
                    <span className="text-text">
                      {Math.max(
                        +stakedBalanceFormatted +
                          (activeTab === STAKE_TAB.Unstake ? -(inputValue || '0') : +(inputValue || '0')),
                        0,
                      )}{' '}
                      KNC
                    </span>
                  </>
                )}
              </span>
            </RowBetween>
            <RowBetween>
              <span>
                <Trans>Voting power</Trans>{' '}
                <InfoHelper
                  text={t`Your voting power is calculated by [Your Staked KNC] / [Total Staked KNC] * 100%.`}
                />
              </span>
              <span>
                {currentVotingPower}%
                {activeTab !== STAKE_TAB.Delegate && (
                  <>
                    {' '}
                    &rarr; <span className="text-text">{newVotingPower}%</span>
                  </>
                )}
              </span>
            </RowBetween>
          </Stack>
        }
      />
      <DelegateConfirmModal
        address={delegateAddress}
        isUndelegate={isUndelegate.current}
        delegatedAddress={delegatedAddress}
        onAddressChange={setDelegateAddress}
        delegateCallback={onDelegateConfirmed}
      />
      <YourTransactionsModal />
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => setShowConfirm(false)}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        pendingText={pendingText}
        content={() => {
          if (transactionError) {
            return <TransactionErrorContent onDismiss={() => setShowConfirm(false)} message={transactionError} />
          } else {
            return <></>
          }
        }}
      />
      <MigrateModal
        setPendingText={setPendingText}
        setShowConfirm={setShowConfirm}
        setAttemptingTxn={setAttemptingTxn}
        setTxHash={setTxHash}
        setTransactionError={setTransactionError}
      />
    </Stack>
  )
}
