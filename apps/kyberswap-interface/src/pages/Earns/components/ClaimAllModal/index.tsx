import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

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

  // Auto-select the first chain when none is selected yet
  useEffect(() => {
    if (selectedChainId) return
    const chains = activeTab === 'ks' ? effectiveFilteredRewardInfo.chains : merklChainRewards
    if (chains.length > 0) {
      setSelectedChainId(chains[0].chainId)
    }
  }, [activeTab, effectiveFilteredRewardInfo.chains, merklChainRewards, selectedChainId])

  // Reset selected chain only when switching tabs
  useEffect(() => {
    const chains = activeTab === 'ks' ? effectiveFilteredRewardInfo.chains : merklChainRewards
    if (chains.length > 0) {
      setSelectedChainId(chains[0].chainId)
    } else {
      setSelectedChainId(null)
    }
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
          <Text fontSize={20} fontWeight={500}>
            {t`Claim Rewards`}
          </Text>
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
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Flex alignItems={'center'} justifyContent={'space-between'}>
              <Text>{t`Claimable Reward`}</Text>
              <Text>{formatDisplayNumber(currentTotalValue, { significantDigits: 4, style: 'currency' })}</Text>
            </Flex>

            <Flex flexDirection={'column'} sx={{ gap: 1 }}>
              {[...currentChains]
                .filter(chain => chain.claimableUsdValue > 0)
                .sort((a, b) => b.claimableUsdValue - a.claimableUsdValue)
                .map(chain => {
                  const isSelected = selectedChainId === chain.chainId

                  return (
                    <ChainRewardItem key={chain.chainId} isSelected={isSelected}>
                      <ChainRewardTitle onClick={() => handleSelectChain(chain.chainId)}>
                        <Flex alignItems="center" sx={{ gap: 2 }}>
                          <CustomRadio
                            type="radio"
                            isSelected={isSelected}
                            checked={isSelected}
                            onChange={() => handleSelectChain(chain.chainId)}
                          />
                          <TokenLogo src={chain.chainLogo} size={16} alt={chain.chainName} />
                          <Text>{chain.chainName}</Text>
                        </Flex>
                        <Text fontSize={upToExtraSmall ? 16 : 18}>
                          {formatDisplayNumber(chain.claimableUsdValue, { significantDigits: 4, style: 'currency' })}
                        </Text>
                      </ChainRewardTitle>
                      <ChainRewardTokens
                        data-open={isSelected ? 'true' : 'false'}
                        data-signal={chain.tokens.length > 5 ? 'true' : 'false'}
                        showArrow
                        showBackground
                      >
                        {[...chain.tokens]
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
            </Flex>
          </Flex>

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
                <Text>{t`You are currently claiming`}</Text>
                {isLoadingUserPositions && activeTab === 'ks' ? (
                  <Skeleton
                    width={60}
                    baseColor={theme.darkText}
                    highlightColor={theme.disableText}
                    borderRadius="1rem"
                  />
                ) : (
                  <Text color={theme.text}>
                    {formatDisplayNumber(selectedRewardChain.claimableUsdValue, {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </Text>
                )}
                <Text>{t`on`}</Text>
                <Text>{selectedRewardChain.chainName}</Text>
                <ChevronDown
                  size={16}
                  color={theme.subText}
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

        <Row gap="16px" flexDirection={upToExtraSmall ? 'column-reverse' : 'row'}>
          <ButtonOutlined onClick={onClose}>{t`Cancel`}</ButtonOutlined>
          <ButtonPrimary
            gap="4px"
            disabled={isClaiming || !selectedRewardChain?.claimableUsdValue}
            onClick={handleClaim}
          >
            {isClaiming && <Loader stroke={'#505050'} />}
            {isClaiming ? t`Claiming` : activeTab === 'bonus' ? t`Claim Incentives` : t`Claim Rewards`}
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
