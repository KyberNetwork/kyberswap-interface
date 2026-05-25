import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import Row from 'components/Row'
import TokenLogo from 'components/TokenLogo'
import { useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { TokenRewardRow } from 'pages/Earns/components/ClaimAllModal/TokenRewardRow'
import {
  ChainRewardItem,
  ChainRewardTitle,
  ChainRewardTokens,
  CustomRadio,
  FilteredChainTitle,
  FilteredChainTokens,
  FilteredChainWrapper,
  RewardTab,
  RewardTabGroup,
} from 'pages/Earns/components/ClaimAllModal/styles'
import { ClaimInfoWrapper, ModalHeader, Wrapper, X } from 'pages/Earns/components/ClaimModal/styles'
import { PositionStatus } from 'pages/Earns/components/PositionStatusControl'
import { RewardsFilterSetting } from 'pages/Earns/components/RewardsFilterSetting'
import { ChainRewardInfo, RewardInfo } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export type RewardTabType = 'ks' | 'bonus'

const emptyRewardInfo: RewardInfo = {
  totalUsdValue: 0,
  totalLmUsdValue: 0,
  totalEgUsdValue: 0,
  claimableUsdValue: 0,
  claimedUsdValue: 0,
  inProgressUsdValue: 0,
  pendingUsdValue: 0,
  vestingUsdValue: 0,
  waitingUsdValue: 0,
  nfts: [],
  chains: [],
  tokens: [],
  egTokens: [],
  lmTokens: [],
}

type Props = {
  rewardInfo?: RewardInfo
  filteredRewardInfo?: RewardInfo
  onClose: () => void
  onClaimAll: () => Promise<void>
  isLoadingUserPositions?: boolean
  thresholdValue?: number
  onThresholdChange?: (value: number) => void
  positionStatus?: PositionStatus
  onPositionStatusChange?: (value: PositionStatus) => void
  merklChainRewards?: ChainRewardInfo[]
  merklTotalUsdValue?: number
  merklSyncingChainIds?: number[]
  merklPendingTxChainIds?: number[]
  onClaimMerkl?: (chainId: number) => Promise<string | undefined>
  activeTab?: RewardTabType
  onTabChange?: (tab: RewardTabType) => void
}

export default function ClaimAllModal({
  rewardInfo,
  filteredRewardInfo,
  onClose,
  onClaimAll,
  isLoadingUserPositions,
  thresholdValue,
  onThresholdChange,
  positionStatus,
  onPositionStatusChange,
  merklChainRewards = [],
  merklTotalUsdValue = 0,
  merklSyncingChainIds = [],
  merklPendingTxChainIds = [],
  onClaimMerkl,
  activeTab: controlledTab,
  onTabChange,
}: Props) {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { library, chainId } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const effectiveRewardInfo = rewardInfo ?? emptyRewardInfo
  const effectiveFilteredRewardInfo = filteredRewardInfo ?? emptyRewardInfo

  const hasBonus = merklChainRewards.length > 0
  const [internalTab, setInternalTab] = useState<RewardTabType>('ks')
  const activeTab = controlledTab ?? internalTab
  const setActiveTab = onTabChange ?? setInternalTab

  const [autoClaim, setAutoClaim] = useState(false)
  const [claimingByChain, setClaimingByChain] = useState<Record<number, boolean>>({})
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)
  const [selectedChainExpanded, setSelectedChainExpanded] = useState(false)

  const currentChains = activeTab === 'ks' ? effectiveFilteredRewardInfo.chains : merklChainRewards
  const currentTotalValue = activeTab === 'ks' ? effectiveRewardInfo.claimableUsdValue : merklTotalUsdValue

  const selectedRewardChain = selectedChainId ? currentChains.find(c => c.chainId === selectedChainId) : null
  const isClaiming = !!(selectedChainId && claimingByChain[selectedChainId])
  // True from tx submission until on-chain confirmation. Without this, the button would
  // re-enable for a few seconds while the user is still waiting for their wallet to confirm.
  const isPendingTxSelectedMerkl =
    activeTab === 'bonus' && !!selectedChainId && merklPendingTxChainIds.includes(selectedChainId)
  const isSyncingSelectedMerkl =
    activeTab === 'bonus' && !!selectedChainId && merklSyncingChainIds.includes(selectedChainId)

  const handleClaim = useCallback(async () => {
    if (!library || !selectedChainId) return
    const accounts = await library.listAccounts()
    if (chainId !== selectedChainId || !accounts.length) {
      if (chainId !== selectedChainId) changeNetwork(selectedChainId)
      setAutoClaim(true)
      return
    }

    setClaimingByChain(prev => ({ ...prev, [selectedChainId]: true }))
    try {
      if (activeTab === 'ks') {
        await onClaimAll()
      } else if (onClaimMerkl) {
        await onClaimMerkl(selectedChainId)
      }
    } finally {
      setClaimingByChain(prev => ({ ...prev, [selectedChainId]: false }))
    }
  }, [chainId, changeNetwork, library, onClaimAll, onClaimMerkl, selectedChainId, activeTab])

  const handleSelectChain = (cId: number) => {
    if (cId !== selectedChainId) {
      setSelectedChainId(cId)
      setSelectedChainExpanded(false)
    }
  }

  // Pick the chain with the highest claimable USD value
  const pickTopChainId = (chains: ChainRewardInfo[]): number | null => {
    if (!chains.length) return null
    const top = [...chains].sort((a, b) => b.claimableUsdValue - a.claimableUsdValue)[0]
    return top.chainId
  }

  // Auto-select the top chain when none is selected yet
  useEffect(() => {
    if (selectedChainId) return
    const chains = activeTab === 'ks' ? effectiveFilteredRewardInfo.chains : merklChainRewards
    const topId = pickTopChainId(chains)
    if (topId !== null) {
      setSelectedChainId(topId)
    }
  }, [activeTab, effectiveFilteredRewardInfo.chains, merklChainRewards, selectedChainId])

  // Reset selected chain only when switching tabs
  useEffect(() => {
    const chains = activeTab === 'ks' ? effectiveFilteredRewardInfo.chains : merklChainRewards
    setSelectedChainId(pickTopChainId(chains))
    setSelectedChainExpanded(false)
    setAutoClaim(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    if (autoClaim && chainId === selectedChainId) {
      handleClaim()
      setAutoClaim(false)
    }
  }, [autoClaim, chainId, handleClaim, selectedChainId])

  return (
    <Modal isOpen onDismiss={onClose} maxWidth={460}>
      <Wrapper>
        <ModalHeader>
          <span className="text-xl font-medium">{t`Claim Rewards`}</span>
          <X onClick={onClose} />
        </ModalHeader>

        {hasBonus && (
          <RewardTabGroup>
            <RewardTab active={activeTab === 'ks'} onClick={() => setActiveTab('ks')}>
              {t`KS Rewards`}{' '}
              {formatDisplayNumber(effectiveRewardInfo.claimableUsdValue, { significantDigits: 4, style: 'currency' })}
            </RewardTab>
            <RewardTab active={activeTab === 'bonus'} onClick={() => setActiveTab('bonus')}>
              {t`Bonus`}
              <InfoHelper
                text={t`These bonus rewards are funded & distributed by a third party via Merkl. Claiming is per wallet on this chain (not per position).`}
                size={14}
              />
              {formatDisplayNumber(merklTotalUsdValue, { significantDigits: 4, style: 'currency' })}
            </RewardTab>
          </RewardTabGroup>
        )}

        <ClaimInfoWrapper>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span>{t`Claimable Reward`}</span>
              <span>{formatDisplayNumber(currentTotalValue, { significantDigits: 4, style: 'currency' })}</span>
            </div>

            <div className="flex flex-col gap-1">
              {[...currentChains]
                .filter(chain => chain.claimableUsdValue > 0)
                .sort((a, b) => b.claimableUsdValue - a.claimableUsdValue)
                .map(chain => {
                  const isSelected = selectedChainId === chain.chainId

                  return (
                    <ChainRewardItem key={chain.chainId} isSelected={isSelected}>
                      <ChainRewardTitle onClick={() => handleSelectChain(chain.chainId)}>
                        <div className="flex items-center gap-2">
                          <CustomRadio
                            type="radio"
                            isSelected={isSelected}
                            checked={isSelected}
                            onChange={() => handleSelectChain(chain.chainId)}
                          />
                          <TokenLogo src={chain.chainLogo} size={16} alt={chain.chainName} />
                          <span>{chain.chainName}</span>
                        </div>
                        <span className={upToExtraSmall ? 'text-base' : 'text-lg'}>
                          {formatDisplayNumber(chain.claimableUsdValue, { significantDigits: 4, style: 'currency' })}
                        </span>
                      </ChainRewardTitle>
                      <ChainRewardTokens
                        data-open={isSelected ? 'true' : 'false'}
                        data-signal={chain.tokens.length > 5 ? 'true' : 'false'}
                        showArrow
                        showBackground
                      >
                        {[...chain.tokens]
                          .filter(token => token.claimableUsdValue > 0)
                          .sort((a, b) => b.claimableUsdValue - a.claimableUsdValue)
                          .map(token => (
                            <TokenRewardRow
                              key={token.address}
                              token={token}
                              chainLogo={chain.chainLogo}
                              chainName={chain.chainName}
                            />
                          ))}
                      </ChainRewardTokens>
                    </ChainRewardItem>
                  )
                })}
            </div>
          </div>

          {activeTab === 'ks' && (
            <RewardsFilterSetting
              thresholdValue={thresholdValue}
              positionStatus={positionStatus}
              onThresholdChange={onThresholdChange}
              onPositionStatusChange={onPositionStatusChange}
            />
          )}

          {!!selectedRewardChain && (
            <FilteredChainWrapper>
              <FilteredChainTitle onClick={() => setSelectedChainExpanded(expanded => !expanded)}>
                <span>{t`You are currently claiming`}</span>
                {isLoadingUserPositions && activeTab === 'ks' ? (
                  <Skeleton
                    width={60}
                    baseColor={theme.darkText}
                    highlightColor={theme.disableText}
                    borderRadius="1rem"
                  />
                ) : (
                  <span className="text-text">
                    {formatDisplayNumber(selectedRewardChain.claimableUsdValue, {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </span>
                )}
                <span>{t`on`}</span>
                <span>{selectedRewardChain.chainName}</span>
                <ChevronDown
                  size={16}
                  className="text-subText"
                  style={{
                    transform: selectedChainExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </FilteredChainTitle>

              <FilteredChainTokens
                data-open={selectedChainExpanded ? 'true' : 'false'}
                data-signal={selectedRewardChain.tokens.length > 5 ? 'true' : 'false'}
                showBackground
              >
                {[...selectedRewardChain.tokens]
                  .filter(token => token.claimableUsdValue > 0)
                  .sort((a, b) => b.claimableUsdValue - a.claimableUsdValue)
                  .map(token => (
                    <TokenRewardRow
                      key={token.address}
                      token={token}
                      chainLogo={selectedRewardChain.chainLogo}
                      chainName={selectedRewardChain.chainName}
                    />
                  ))}
              </FilteredChainTokens>
            </FilteredChainWrapper>
          )}
        </ClaimInfoWrapper>

        {isSyncingSelectedMerkl && (
          <span className="-mt-1 text-xs text-warning">
            {t`Syncing your last claim with Merkl — please wait a moment.`}
          </span>
        )}

        <Row className="flex-row gap-4 max-xs:flex-col-reverse">
          <ButtonOutlined onClick={onClose}>{t`Cancel`}</ButtonOutlined>
          <ButtonPrimary
            gap="4px"
            disabled={
              isClaiming ||
              isPendingTxSelectedMerkl ||
              isSyncingSelectedMerkl ||
              !selectedRewardChain?.claimableUsdValue
            }
            onClick={handleClaim}
          >
            {(isClaiming || isPendingTxSelectedMerkl || isSyncingSelectedMerkl) && <Loader className="text-border" />}
            {isClaiming || isPendingTxSelectedMerkl
              ? t`Claiming`
              : isSyncingSelectedMerkl
              ? t`Syncing`
              : activeTab === 'bonus'
              ? t`Claim Incentives`
              : t`Claim Rewards`}
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
