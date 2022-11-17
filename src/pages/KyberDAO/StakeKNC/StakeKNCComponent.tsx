import { ChainId, MaxUint256, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { lighten } from 'polished'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn, ColumnCenter } from 'components/Column'
import ExpandableBox from 'components/ExpandableBox'
import HistoryIcon from 'components/Icons/History'
import Wallet from 'components/Icons/Wallet'
import WarningIcon from 'components/Icons/WarningIcon'
import InfoHelper from 'components/InfoHelper'
import { AutoRow, RowBetween, RowFit } from 'components/Row'
import TransactionConfirmationModal from 'components/TransactionConfirmationModal'
import { KNCL_ADDRESS, KNC_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { KYBERDAO_ADDRESSES, useKyberDaoStakeActions, useStakingInfo, useVotingInfo } from 'hooks/kyberdao'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useKNCPrice, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { isAddress } from 'utils'

import KNCLogo from '../kncLogo'
import ApproveKNCLModal from './ApproveKNCLModal'
import ApproveKNCModal from './ApproveKNCModal'
import DelegateConfirmModal from './DelegateConfirmModal'
import MigrateModal from './MigrateModal'
import SwitchToEthereumModal, { useSwitchToEthereum } from './SwitchToEthereumModal'
import YourTransactionsModal from './YourTransactionsModal'

const STAKE_TAB: { [key: string]: string } = {
  Stake: 'Stake',
  Unstake: 'Unstake',
  Delegate: 'Delegate',
}
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 404px;
  order: 4;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    order: 2;
  `}
  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    width: 100vw;
    padding: 0 16px;
  `}
`
const TabSelect = styled.div`
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 18px;

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    gap: inherit;
    justify-content: space-between;
  `}
`
const FormWrapper = styled.div`
  background-color: ${({ theme }) => theme.background};
  border-radius: 20px;
  padding: 16px;
  width: 100%;
`

export const InnerCard = styled.div`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16));
`

export const SmallButton = styled.button`
  padding: 3px 8px;
  font-size: 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all ease-in-out 0.1s;
  ${({ theme }) => css`
    background-color: ${theme.tableHeader};
    color: ${theme.subText};
    :hover {
      background-color: ${lighten(0.05, theme.tableHeader)};
    }
    :active {
      background-color: ${lighten(0.1, theme.tableHeader)};
    }
  `}
`

const TabOption = styled.div<{ $active?: boolean }>`
  font-size: 20px;
  line-height: 24px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => lighten(0.1, theme.primary)};
  }
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    font-size: 16px;
    line-height: 20px;
    &:last-child {
      margin-left: 0;
    }
  `}
`
const StakeFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
  margin-bottom: 16px;
`
const YourStakedKNC = styled(FormWrapper)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`
const StakeForm = styled(FormWrapper)`
  display: flex;
  gap: 16px;
  flex-direction: column;
`

export const CurrencyInput = styled.input<{ disabled?: boolean }>`
  background: none;
  border: none;
  outline: none;
  color: ${({ theme, disabled }) => (disabled ? theme.subText : theme.text)};
  font-size: 24px;
  width: 0;
  flex: 1;
  ${({ disabled }) =>
    disabled &&
    `
      cursor: not-allowed;
    `}
`

const AddressInput = styled.input`
  background: none;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  min-width: 0;
  :disabled {
    color: ${({ theme }) => theme.border};
  }
`

export const KNCLogoWrapper = styled.div`
  border-radius: 20px;
  background: ${({ theme }) => theme.background};
  padding: 8px 12px 8px 8px;
  display: flex;
  color: ${({ theme }) => theme.subText};
  gap: 4px;
  font-size: 20px;
`

const GetKNCButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: ${({ theme }) => theme.subText};
`
const HistoryButton = styled(RowFit)`
  justify-content: flex-end;
  gap: 4px;
  cursor: pointer;
  :hover {
    color: ${({ theme }) => lighten(0.2, theme.primary)};
  }
`

export default function StakeKNCComponent() {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const { stakedBalance, KNCBalance, delegatedAccount } = useStakingInfo()
  const { calculateVotingPower } = useVotingInfo()
  const isDelegated = !!delegatedAccount && delegatedAccount !== account
  const { stake, unstake, delegate, undelegate } = useKyberDaoStakeActions()
  const [activeTab, setActiveTab] = useState(STAKE_TAB.Stake)
  const [delegateAddress, setDelegateAddress] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [pendingText, setPendingText] = useState<string>('')

  const [txHash, setTxHash] = useState<string | undefined>(undefined)
  const [inputValue, setInputValue] = useState('1')

  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  useEffect(() => {
    if (chainId !== ChainId.MAINNET) {
      setErrorMessage(undefined)
      return
    }
    if (!inputValue || isNaN(parseFloat(inputValue)) || parseFloat(inputValue) <= 0) {
      setErrorMessage(t`Invalid amount`)
    } else if (
      (parseFloat(inputValue) > parseFloat(formatUnits(KNCBalance)) && activeTab === STAKE_TAB.Stake) ||
      (parseFloat(inputValue) > parseFloat(formatUnits(stakedBalance)) && activeTab === STAKE_TAB.Unstake)
    ) {
      setErrorMessage(t`Insufficient amount`)
    } else if (activeTab === STAKE_TAB.Delegate && delegateAddress !== '' && !isAddress(delegateAddress)) {
      setErrorMessage(t`Invalid Ethereum address`)
    } else {
      setErrorMessage(undefined)
    }
  }, [chainId, inputValue, KNCBalance, stakedBalance, activeTab, delegateAddress])

  const toggleWalletModal = useWalletModalToggle()
  const toggleDelegateConfirm = useToggleModal(ApplicationModal.DELEGATE_CONFIRM)
  const toggleYourTransactions = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const toggleApproveModal = useToggleModal(ApplicationModal.APPROVE_KNC)
  const { switchToEthereum } = useSwitchToEthereum()

  const KNCtoken = useCurrency(KNC_ADDRESS)
  const amountToApprove = tryParseAmount(inputValue, KNCtoken || undefined)
  const [approval, approveCallback] = useApproveCallback(amountToApprove, KYBERDAO_ADDRESSES.STAKING)
  const KNCLtoken = useCurrency(KNCL_ADDRESS)
  const [approvalKNCL, approveKNCLCallback] = useApproveCallback(
    !!KNCLtoken ? TokenAmount.fromRawAmount(KNCLtoken, MaxUint256.toString()) : undefined,
    KNCL_ADDRESS,
  )
  const handleStake = useCallback(() => {
    switchToEthereum().then(() => {
      if (approval === ApprovalState.APPROVED) {
        setPendingText(t`Staking ${inputValue} KNC to KyberDAO`)
        setShowConfirm(true)
        setAttemptingTxn(true)
        stake(parseUnits(inputValue, 18))
          .then(tx => {
            setAttemptingTxn(false)
            setTxHash(tx)
          })
          .catch(() => {
            setAttemptingTxn(false)
            setTxHash(undefined)
          })
      } else {
        toggleApproveModal()
      }
    })
  }, [switchToEthereum, stake, toggleApproveModal, approval, inputValue])

  const handleUnstake = useCallback(() => {
    switchToEthereum().then(() => {
      if (approval === ApprovalState.APPROVED) {
        setPendingText(t`Unstaking ${inputValue} KNC from KyberDAO`)
        setShowConfirm(true)
        setAttemptingTxn(true)
        unstake(parseUnits(inputValue, 18))
          .then(tx => {
            setAttemptingTxn(false)
            setTxHash(tx)
          })
          .catch(() => {
            setAttemptingTxn(false)
          })
      } else {
        toggleApproveModal()
      }
    })
  }, [switchToEthereum, unstake, toggleApproveModal, approval, inputValue])
  const handleDelegate = useCallback(() => {
    switchToEthereum().then(() => {
      toggleDelegateConfirm()
    })
  }, [switchToEthereum, toggleDelegateConfirm])

  const onDelegateConfirmed = useCallback(() => {
    if (!account) return
    if (isDelegated) {
      setPendingText(t`You are undelegating your voting from ${delegatedAccount}.`)
      setShowConfirm(true)
      setAttemptingTxn(true)
      undelegate(account)
        .then(tx => {
          setAttemptingTxn(false)
          setTxHash(tx)
        })
        .catch(() => {
          setAttemptingTxn(false)
        })
    } else {
      setPendingText(t`You are delegating your voting power to ${delegateAddress}.`)
      setShowConfirm(true)
      setAttemptingTxn(true)
      delegate(delegateAddress)
        .then(tx => {
          setAttemptingTxn(false)
          setTxHash(tx)
        })
        .catch(() => {
          setAttemptingTxn(false)
        })
    }
    toggleDelegateConfirm()
  }, [delegate, delegateAddress, account, delegatedAccount, isDelegated, toggleDelegateConfirm, undelegate])

  const kncPrice = useKNCPrice()
  const kncValueInUsd = useMemo(() => {
    if (!kncPrice || !inputValue) return 0
    return (parseFloat(kncPrice) * parseFloat(inputValue)).toFixed(2)
  }, [kncPrice, inputValue])

  const handleMaxClick = useCallback(
    (half?: boolean) => {
      const balance = activeTab === STAKE_TAB.Stake ? KNCBalance : stakedBalance
      setInputValue(formatUnits(balance.div(!!half ? 2 : 1)))
    },
    [activeTab, KNCBalance, stakedBalance],
  )

  // Reset input value on tab changes
  useEffect(() => {
    setInputValue('1')
  }, [activeTab])

  return (
    <Wrapper>
      <TabSelect>
        {Object.keys(STAKE_TAB).map((tab: string) => (
          <TabOption key={tab} onClick={() => setActiveTab(STAKE_TAB[tab])} $active={activeTab === STAKE_TAB[tab]}>
            {tab}
          </TabOption>
        ))}
      </TabSelect>
      <YourStakedKNC>
        <Text fontSize={12} lineHeight="16px" color={theme.subText}>
          <Trans>Your Staked KNC</Trans>
        </Text>
        <Text
          fontSize={16}
          lineHeight="20px"
          color={theme.text}
          display="flex"
          alignItems="center"
          style={{ gap: '8px' }}
        >
          <KNCLogo size={20} /> {formatUnits(stakedBalance)} KNC
        </Text>
      </YourStakedKNC>

      <StakeFormWrapper>
        <StakeForm>
          <RowBetween color={theme.subText}>
            <GetKNCButton to="/swap/ethereum/eth-to-knc">
              <Repeat size={16} />
              <Text fontSize={14}>
                <Trans>Get KNC</Trans>
              </Text>
            </GetKNCButton>
            <HistoryButton onClick={toggleYourTransactions}>
              <HistoryIcon size={18} /> <Text fontSize={14}>History</Text>
            </HistoryButton>
          </RowBetween>
          {(activeTab === STAKE_TAB.Stake || activeTab === STAKE_TAB.Unstake) && (
            <>
              <InnerCard>
                <RowBetween width={'100%'}>
                  <AutoRow gap="2px">
                    <SmallButton onClick={() => handleMaxClick()}>Max</SmallButton>
                    <SmallButton onClick={() => handleMaxClick(true)}>Half</SmallButton>
                  </AutoRow>
                  {activeTab === STAKE_TAB.Stake && (
                    <AutoRow gap="3px" justify="flex-end" color={theme.subText}>
                      <Wallet /> <Text fontSize={12}>{KNCBalance ? formatUnits(KNCBalance) : 0}</Text>
                    </AutoRow>
                  )}
                </RowBetween>
                <RowBetween>
                  <CurrencyInput type="number" value={inputValue} onChange={e => setInputValue(e.target.value)} />
                  <span style={{ color: theme.border, fontSize: '14px', marginRight: '6px' }}>~${kncValueInUsd}</span>
                  <KNCLogoWrapper>
                    <KNCLogo />
                    KNC
                  </KNCLogoWrapper>
                </RowBetween>
              </InnerCard>
              {account ? (
                <ButtonPrimary
                  margin="8px 0px"
                  onClick={() => {
                    if (activeTab === STAKE_TAB.Stake) {
                      handleStake()
                    } else {
                      handleUnstake()
                    }
                  }}
                  disabled={!!errorMessage}
                >
                  {errorMessage || (activeTab === STAKE_TAB.Stake ? t`Stake` : t`Unstake`)}
                </ButtonPrimary>
              ) : (
                <ButtonLight onClick={toggleWalletModal}>
                  <InfoHelper
                    size={20}
                    fontSize={12}
                    color={theme.primary}
                    text={t`Staking KNC is only available on Ethereum chain`}
                    style={{ marginRight: '5px' }}
                    placement="top"
                  />
                  <Trans>Connect Wallet</Trans>
                </ButtonLight>
              )}
            </>
          )}
          {activeTab === STAKE_TAB.Delegate && (
            <>
              <Text color={theme.subText} fontSize={12} lineHeight="16px">
                <Trans>Delegate Address</Trans>
              </Text>
              <InnerCard>
                <AddressInput
                  value={isDelegated ? delegatedAccount : delegateAddress}
                  onChange={e => {
                    setDelegateAddress(e.target.value)
                  }}
                  disabled={isDelegated}
                  placeholder="Ethereum Address"
                />
              </InnerCard>
              <Text color={theme.subText} fontSize={12} lineHeight="14px" fontStyle="italic">
                <Trans>*Only delegate to Ethereum address</Trans>
              </Text>
              <ExpandableBox
                borderRadius="16px"
                backgroundColor={theme.buttonBlack}
                padding="16px"
                color={theme.subText}
                style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))' }}
                headerContent={
                  <AutoRow>
                    <ColumnCenter style={{ width: '30px' }}>
                      <WarningIcon />
                    </ColumnCenter>
                    <Text fontSize={12} color={theme.subText}>
                      <Trans>Important Notice: Kyber Network does not hold your funds or manage this process.</Trans>
                    </Text>
                  </AutoRow>
                }
                expandContent={
                  <Text margin={'0 30px'} fontSize={12}>
                    <Trans>
                      In this default delegation method, your delegate is responsible for voting on your behalf and
                      distributing your KNC rewards to you, though only you can withdraw/unstake your own KNC
                    </Trans>
                  </Text>
                }
              />
              <ButtonPrimary margin="8px 0px" onClick={handleDelegate} disabled={!!errorMessage}>
                {errorMessage || (isDelegated ? <Trans>Undelegate</Trans> : <Trans>Delegate</Trans>)}
              </ButtonPrimary>
            </>
          )}
        </StakeForm>
      </StakeFormWrapper>
      <ExpandableBox
        border={`1px solid ${theme.border}`}
        backgroundColor={theme.buttonBlack}
        borderRadius="16px"
        color={theme.subText}
        padding={'12px 16px'}
        headerContent={
          <Text fontSize={12} color={theme.text} style={{ textTransform: 'uppercase' }}>
            <Trans>Stake Information</Trans>
          </Text>
        }
        expandContent={
          <AutoColumn gap="10px" style={{ fontSize: '12px' }}>
            <RowBetween>
              <Text>
                <Trans>Stake Amount</Trans>
              </Text>
              <Text>
                {formatUnits(stakedBalance)} KNC &rarr;{' '}
                <span style={{ color: theme.text }}>
                  {parseFloat(formatUnits(stakedBalance)) + parseFloat(inputValue || '0')} KNC
                </span>
              </Text>
            </RowBetween>
            <RowBetween>
              <Text>
                <Trans>Voting power</Trans>{' '}
                <InfoHelper
                  text={t`Your voting power is calculated by
[Your Staked KNC] / [Total Staked KNC] * 100%`}
                />
              </Text>
              <Text>
                {calculateVotingPower(formatUnits(stakedBalance))}% &rarr;{' '}
                <span style={{ color: theme.text }}>
                  {calculateVotingPower(
                    (parseFloat(formatUnits(stakedBalance)) + parseFloat(inputValue || '0')).toString(),
                  )}
                  %
                </span>
              </Text>
            </RowBetween>
          </AutoColumn>
        }
      />
      <SwitchToEthereumModal />
      <DelegateConfirmModal
        address={delegateAddress}
        delegatedAccount={delegatedAccount}
        onAddressChange={setDelegateAddress}
        delegateCallback={onDelegateConfirmed}
      />
      <YourTransactionsModal />
      <ApproveKNCModal approvalState={approval} approveCallback={approveCallback} />
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => setShowConfirm(false)}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        pendingText={pendingText}
        content={() => {
          return <></>
        }}
      />
      <MigrateModal
        approval={approvalKNCL}
        setPendingText={setPendingText}
        setShowConfirm={setShowConfirm}
        setAttemptingTxn={setAttemptingTxn}
        setTxHash={setTxHash}
      />
      <ApproveKNCLModal approvalState={approvalKNCL} approveCallback={approveKNCLCallback} />
    </Wrapper>
  )
}
