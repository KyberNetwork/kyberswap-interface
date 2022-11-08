import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { lighten } from 'polished'
import { useCallback, useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn, ColumnCenter } from 'components/Column'
import ExpandableBox from 'components/ExpandableBox'
import Cart from 'components/Icons/Cart'
import HistoryIcon from 'components/Icons/History'
import Wallet from 'components/Icons/Wallet'
import WarningIcon from 'components/Icons/WarningIcon'
import InfoHelper from 'components/InfoHelper'
import { AutoRow, RowBetween, RowFit } from 'components/Row'
import { KNC_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { useKyberDaoStakeActions, useStakingInfo } from 'hooks/kyberdao'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { NotificationType, useKNCPrice, useNotify, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { getFullDisplayBalance } from 'utils/formatBalance'

import KNCLogo from '../kncLogo'
import ApproveModal from './ApproveModal'
import DelegateConfirmModal from './DelegateConfirmModal'
import GasPriceExpandableBox from './GasPriceExpandableBox'
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
  ${({ theme }) => theme.mediaWidth.upToMedium`
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

export const CurrencyInput = styled.input`
  background: none;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.text};
  font-size: 24px;
  width: 0;
  flex: 1;
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

export default function StakeKNCComponent() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { stakedBalance, KNCBalance, delegatedAccount } = useStakingInfo()
  const isDelegated = !!delegatedAccount
  const { stake, unstake, delegate, undelegate } = useKyberDaoStakeActions()
  const [activeTab, setActiveTab] = useState(STAKE_TAB.Stake)
  const [delegateAddress, setDelegateAddress] = useState('')
  const [inputValue, setInputValue] = useState('1')
  const toggleWalletModal = useWalletModalToggle()
  const toggleDelegateConfirm = useToggleModal(ApplicationModal.DELEGATE_CONFIRM)
  const toggleYourTransactions = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const toggleApproveModal = useToggleModal(ApplicationModal.APPROVE_KNC)
  const KNCtoken = useCurrency(KNC_ADDRESS)
  const { switchToEthereum } = useSwitchToEthereum()

  //TODO: refactor this
  const amountToApprove = tryParseAmount(inputValue, KNCtoken || undefined)
  const [approval, approveCallback] = useApproveCallback(amountToApprove, '0xeadb96F1623176144EBa2B24e35325220972b3bD')

  const handleStake = useCallback(() => {
    switchToEthereum().then(() => {
      if (approval === ApprovalState.APPROVED) {
        stake(parseUnits(inputValue, 18))
      } else {
        toggleApproveModal()
      }
    })
  }, [switchToEthereum, stake, toggleApproveModal, approval])

  const handleUnstake = useCallback(() => {
    switchToEthereum().then(() => {
      if (approval === ApprovalState.APPROVED) {
        unstake(parseUnits(inputValue, 18))
      } else {
        toggleApproveModal()
      }
    })
  }, [switchToEthereum, unstake, toggleApproveModal, approval])
  const handleDelegate = useCallback(() => {
    switchToEthereum().then(() => {
      toggleDelegateConfirm()
    })
  }, [switchToEthereum, toggleDelegateConfirm])

  const onDelegateConfirmed = useCallback(() => {
    if (!account) return
    if (isDelegated) {
      undelegate(account)
    } else {
      delegate(delegateAddress)
    }
    toggleDelegateConfirm()
  }, [delegate, delegateAddress, account])

  const kncPrice = useKNCPrice()
  const kncValueInUsd = useMemo(() => {
    if (!kncPrice || !inputValue) return 0
    return (parseFloat(kncPrice) * parseFloat(inputValue)).toFixed(2)
  }, [kncPrice, inputValue])
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
          <KNCLogo size={20} /> {getFullDisplayBalance(stakedBalance, 18)} KNC
        </Text>
      </YourStakedKNC>

      <StakeFormWrapper>
        <StakeForm>
          <RowBetween color={theme.subText}>
            <RowFit gap="4px" color={theme.subText}>
              <Cart />
              <Text fontSize={14}>
                <Trans>Get KNC</Trans>
              </Text>
            </RowFit>
            <RowFit justifyContent="flex-end" onClick={toggleYourTransactions} gap="4px" style={{ cursor: 'pointer' }}>
              <HistoryIcon size={18} /> <Text fontSize={14}>History</Text>
            </RowFit>
          </RowBetween>
          {(activeTab === STAKE_TAB.Stake || activeTab === STAKE_TAB.Unstake) && (
            <>
              <InnerCard>
                <RowBetween width={'100%'}>
                  <AutoRow gap="2px">
                    <SmallButton
                      onClick={() => setInputValue(getFullDisplayBalance(KNCBalance.value, KNCBalance.decimals))}
                    >
                      Max
                    </SmallButton>
                    <SmallButton
                      onClick={() => setInputValue(getFullDisplayBalance(KNCBalance.value.div(2), KNCBalance.decimals))}
                    >
                      Half
                    </SmallButton>
                  </AutoRow>
                  <AutoRow gap="3px" justify="flex-end" color={theme.subText}>
                    <Wallet />{' '}
                    <Text fontSize={12}>
                      {KNCBalance ? getFullDisplayBalance(KNCBalance.value, KNCBalance.decimals) : 0}
                    </Text>
                  </AutoRow>
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
              <GasPriceExpandableBox />
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
                >
                  {activeTab === STAKE_TAB.Stake ? 'Stake' : 'Unstake'}
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
              <ButtonPrimary margin="8px 0px" onClick={handleDelegate}>
                {!!delegatedAccount ? <Trans>Undelegate</Trans> : <Trans>Delegate</Trans>}
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
                0 KNC &rarr; <span style={{ color: theme.text }}>100 KNC</span>
              </Text>
            </RowBetween>
            <RowBetween>
              <Text>
                <Trans>Voting power</Trans>
              </Text>
              <Text>
                0% &rarr; <span style={{ color: theme.text }}>0.000001%</span>
              </Text>
            </RowBetween>
            <RowBetween>
              <Text>
                <Trans>Gas Fee</Trans>
              </Text>
              <Text color={theme.text}>$25.80</Text>
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
      <ApproveModal approvalState={approval} approveCallback={approveCallback} />
    </Wrapper>
  )
}
