import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Repeat, X } from 'react-feather'
import { Link } from 'react-router-dom'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn, ColumnCenter } from 'components/Column'
import ExpandableBox from 'components/ExpandableBox'
import HistoryIcon from 'components/Icons/History'
import VoteIcon from 'components/Icons/Vote'
import Wallet from 'components/Icons/Wallet'
import WarningIcon from 'components/Icons/WarningIcon'
import InfoHelper from 'components/InfoHelper'
import NumericalInput from 'components/NumericalInput'
import Row, { AutoRow, RowBetween, RowFit } from 'components/Row'
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
import { isAddress, shortenAddress } from 'utils'
import { cn } from 'utils/cn'
import { formatUnits, parseUnits } from 'utils/viem'

enum STAKE_TAB {
  Stake = 'Stake',
  Unstake = 'Unstake',
  Delegate = 'Delegate',
}

export const SmallButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...rest }, ref) => (
    <button
      ref={ref}
      {...rest}
      className={cn(
        'cursor-pointer rounded-[10px] border-none bg-tableHeader px-2 py-[3px] text-xs leading-[normal] text-subText transition-all duration-100 ease-in-out hover:brightness-105 active:brightness-110',
        className,
      )}
    />
  ),
)
SmallButton.displayName = 'SmallButton'

export const KNCLogoWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      {...rest}
      className={cn('flex gap-1 rounded-[20px] bg-background py-2 pl-2 pr-3 text-xl text-subText', className)}
    />
  ),
)
KNCLogoWrapper.displayName = 'KNCLogoWrapper'

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
  const parsedAmount = useParsedAmount(
    new Token(chainId === ChainId.GÖRLI ? ChainId.GÖRLI : ChainId.MAINNET, kyberDAOInfo?.KNCAddress || '', 18, 'KNC'),
    inputValue,
  )

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

  const handleStake = () => {
    switchToEthereum(t`Staking KNC`)
      .then(() => {
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
      })
      .catch()
  }

  const handleUnstake = () => {
    switchToEthereum(t`Unstaking KNC`)
      .then(() => {
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
      })
      .catch()
  }

  const handleDelegate = () => {
    switchToEthereum(t`Delegate`)
      .then(() => {
        isUndelegate.current = false
        toggleDelegateConfirm()
      })
      .catch(_error => {
        setShowConfirm(false)
      })
  }

  const handleUndelegate = () => {
    switchToEthereum(t`Undelegate`)
      .then(() => {
        isUndelegate.current = true
        toggleDelegateConfirm()
      })
      .catch(() => {
        setShowConfirm(false)
      })
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
    <div className="order-4 flex w-[404px] flex-col max-lg:order-2 max-xxs:w-screen max-xxs:px-4">
      <div className="mb-[18px] flex items-center gap-7 max-xxs:justify-between max-xxs:gap-[inherit]">
        {Object.keys(STAKE_TAB).map((tab: string) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab as STAKE_TAB)}
            className={cn(
              'flex cursor-pointer items-center gap-1 text-xl font-medium leading-6 hover:brightness-110 max-xxs:text-base max-xxs:leading-5',
              activeTab === tab ? 'text-primary' : 'text-subText',
            )}
          >
            {tab}
          </div>
        ))}
      </div>
      <div className="mb-4 flex w-full items-center justify-between rounded-[20px] bg-background p-4">
        <span className="text-xs leading-4 text-subText">
          <Trans>Your Staked KNC</Trans>
        </span>
        <span className="flex items-center gap-2 text-base leading-5 text-text">
          <KNCLogo size={20} /> {stakedBalanceFormatted} KNC
        </span>
      </div>

      <div className="mb-4 flex w-full flex-col gap-4">
        <div className="flex w-full flex-col gap-4 rounded-[20px] bg-background p-4">
          <RowBetween className="text-subText">
            <Link to="/swap/ethereum/eth-to-knc" className="flex items-center justify-center gap-1 text-subText">
              <Repeat size={16} />
              <span className="text-sm">
                <Trans>Get KNC</Trans>
              </span>
            </Link>
            {account && (
              <RowFit
                onClick={toggleYourTransactions}
                className="cursor-pointer justify-end gap-1 hover:brightness-125"
              >
                <HistoryIcon size={18} /> <span className="text-sm">History</span>
              </RowFit>
            )}
          </RowBetween>
          {(activeTab === STAKE_TAB.Stake || activeTab === STAKE_TAB.Unstake) && (
            <>
              <div className="flex flex-col gap-2.5 rounded-2xl bg-buttonBlack px-4 py-3 [filter:drop-shadow(0px_4px_4px_rgba(0,0,0,0.16))]">
                <RowBetween className="w-full">
                  <AutoRow className="gap-0.5">
                    <SmallButton onClick={() => handleMaxClick()}>Max</SmallButton>
                    <SmallButton onClick={() => handleMaxClick(true)}>Half</SmallButton>
                  </AutoRow>
                  {activeTab === STAKE_TAB.Stake && (
                    <AutoRow className="justify-end gap-[3px] text-subText">
                      <Wallet />{' '}
                      <span className="text-xs">{KNCBalance ? formatUnits(BigInt(KNCBalance.toString()), 18) : 0}</span>
                    </AutoRow>
                  )}
                </RowBetween>
                <RowBetween>
                  <NumericalInput value={inputValue} onUserInput={setInputValue} />
                  <span className="mr-1.5 text-sm text-border">~${kncValueInUsd}</span>
                  <KNCLogoWrapper>
                    <KNCLogo />
                    KNC
                  </KNCLogoWrapper>
                </RowBetween>
              </div>
              {account ? (
                <Row className="gap-3">
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
                      margin="8px 0px"
                      onClick={() => {
                        handleStake()
                      }}
                    >
                      {errorMessage || t`Stake`}
                    </ButtonPrimary>
                  ) : (
                    <ButtonPrimary
                      disabled={[ChainId.MAINNET, ChainId.GÖRLI].includes(chainId) && !!errorMessage}
                      margin="8px 0px"
                      onClick={() => {
                        handleUnstake()
                      }}
                    >
                      {errorMessage || t`Unstake`}
                    </ButtonPrimary>
                  )}
                </Row>
              ) : (
                <ButtonLight onClick={toggleWalletModal}>
                  <InfoHelper
                    size={20}
                    fontSize={12}
                    className="text-primary"
                    text={t`Staking KNC is only available on Ethereum chain`}
                    style={{ marginRight: '5px' }}
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
                <span className="text-xs leading-4 text-subText">
                  <Trans>Delegate Address</Trans>
                </span>
                {isDelegated && (
                  <MouseoverTooltip
                    text={t`You have already delegated your voting power to this address.`}
                    placement="top"
                  >
                    <div className="-mb-2 flex select-none items-center gap-1 rounded-[30px] bg-tableHeader px-1.5 py-1 text-xs leading-4 text-subText shadow-[0px_2px_2px_rgba(0,0,0,0.1)] [&>svg:hover]:brightness-125">
                      <VoteIcon /> {shortenAddress(ChainId.MAINNET, delegatedAddress)}{' '}
                      <X style={{ cursor: 'pointer' }} size={16} onClick={handleUndelegate} />
                    </div>
                  </MouseoverTooltip>
                )}
              </RowBetween>
              <div className="flex flex-col gap-2.5 rounded-2xl bg-buttonBlack px-4 py-3 [filter:drop-shadow(0px_4px_4px_rgba(0,0,0,0.16))]">
                <input
                  className="min-w-0 border-none bg-transparent text-sm text-text outline-none disabled:text-border"
                  value={delegateAddress}
                  onChange={e => {
                    setDelegateAddress(e.target.value)
                  }}
                  placeholder="Ethereum Address"
                />
              </div>
              <span className="text-xs italic leading-[14px] text-subText">
                <Trans>*Only delegate to Ethereum address</Trans>
              </span>
              <ExpandableBox
                borderRadius="16px"
                backgroundColor={theme.buttonBlack}
                padding="16px"
                className="text-subText"
                style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))' }}
                headerContent={
                  <AutoRow>
                    <ColumnCenter className="mr-1.5 w-[30px]">
                      <WarningIcon />
                    </ColumnCenter>
                    <span className="text-xs leading-4 text-subText">
                      <Trans>Important Notice: Kyber Network does not hold your funds or manage this process.</Trans>
                    </span>
                  </AutoRow>
                }
                expandContent={
                  <div className="mx-[30px] mr-5 text-xs leading-4">
                    <Trans>
                      In this default delegation method, your delegate is responsible for voting on your behalf and
                      distributing your KNC rewards to you, though only you can withdraw/unstake your own KNC
                    </Trans>
                  </div>
                }
              />
              {account ? (
                <ButtonPrimary margin="8px 0px" onClick={handleDelegate} disabled={!!errorMessage}>
                  {errorMessage || <Trans>Delegate</Trans>}
                </ButtonPrimary>
              ) : (
                <ButtonLight onClick={toggleWalletModal}>
                  <InfoHelper
                    size={20}
                    fontSize={12}
                    className="text-primary"
                    text={t`Delegate is only available on Ethereum chain`}
                    style={{ marginRight: '5px' }}
                    placement="top"
                  />
                  <Trans>Connect</Trans>
                </ButtonLight>
              )}
            </>
          )}
        </div>
      </div>
      <ExpandableBox
        border={`1px solid ${theme.border}`}
        backgroundColor={theme.buttonBlack}
        borderRadius="16px"
        className="text-subText"
        padding={'12px 16px'}
        headerContent={
          <span className="text-xs uppercase text-text">
            <Trans>Stake Information</Trans>
          </span>
        }
        expandContent={
          <AutoColumn className="gap-2.5 text-xs">
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
          </AutoColumn>
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
    </div>
  )
}
