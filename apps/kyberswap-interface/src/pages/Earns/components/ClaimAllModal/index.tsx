import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
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
} from 'pages/Earns/components/ClaimAllModal/styles'
import { ClaimInfoWrapper, ModalHeader, Wrapper, X } from 'pages/Earns/components/ClaimModal/styles'
import { PositionStatus } from 'pages/Earns/components/PositionStatusControl'
import { RewardsFilterSetting } from 'pages/Earns/components/RewardsFilterSetting'
import { RewardInfo } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  rewardInfo: RewardInfo
  filteredRewardInfo: RewardInfo
  onClose: () => void
  claiming: boolean
  setClaiming: (claiming: boolean) => void
  onClaimAll: () => void
  isLoadingUserPositions?: boolean
  thresholdValue?: number
  onThresholdChange?: (value: number) => void
  positionStatus?: PositionStatus
  onPositionStatusChange?: (value: PositionStatus) => void
}

export default function ClaimAllModal({
  rewardInfo,
  filteredRewardInfo,
  onClose,
  claiming,
  setClaiming,
  onClaimAll,
  isLoadingUserPositions,
  thresholdValue,
  onThresholdChange,
  positionStatus,
  onPositionStatusChange,
}: Props) {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { library, chainId } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const [autoClaim, setAutoClaim] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)
  const [selectedChainExpanded, setSelectedChainExpanded] = useState(true)

  const selectedRewardChain = selectedChainId
    ? filteredRewardInfo.chains.find(c => c.chainId === selectedChainId)
    : null

  const handleClaim = useCallback(async () => {
    if (!library || !selectedChainId) return
    const accounts = await library.listAccounts()
    if (chainId !== selectedChainId || !accounts.length) {
      if (chainId !== selectedChainId) changeNetwork(selectedChainId)
      setAutoClaim(true)
      return
    }

    onClaimAll()
  }, [chainId, changeNetwork, library, onClaimAll, selectedChainId])

  const handleSelectChain = (chainId: number) => {
    if (chainId !== selectedChainId) {
      setSelectedChainId(chainId)
    }
  }

  useEffect(() => {
    if (selectedChainId) return
    setSelectedChainId(rewardInfo.chains[0].chainId)
  }, [rewardInfo.chains, selectedChainId])

  useEffect(() => {
    if (autoClaim && chainId === selectedChainId) {
      handleClaim()
      setAutoClaim(false)
    }
  }, [autoClaim, chainId, handleClaim, selectedChainId])

  useEffect(() => {
    return () => {
      setClaiming(false)
    }
  }, [setClaiming])

  return (
    <Modal isOpen onDismiss={onClose} maxWidth={460}>
      <Wrapper>
        <ModalHeader>
          <Text fontSize={20} fontWeight={500}>
            {t`Claim Rewards`}
          </Text>
          <X onClick={onClose} />
        </ModalHeader>
        <ClaimInfoWrapper>
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Flex alignItems={'center'} justifyContent={'space-between'}>
              <Text>{t`Claimable Rewards`}</Text>
              <Text>
                {formatDisplayNumber(rewardInfo.claimableUsdValue, { significantDigits: 4, style: 'currency' })}
              </Text>
            </Flex>

            <Flex flexDirection={'column'} sx={{ gap: 1 }}>
              {rewardInfo.chains
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
                        {chain.tokens
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

          <RewardsFilterSetting
            thresholdValue={thresholdValue}
            positionStatus={positionStatus}
            onThresholdChange={onThresholdChange}
            onPositionStatusChange={onPositionStatusChange}
          />

          {!!selectedRewardChain && (
            <FilteredChainWrapper>
              <FilteredChainTitle onClick={() => setSelectedChainExpanded(expanded => !expanded)}>
                <Text>{t`You are currently claiming`}</Text>
                {isLoadingUserPositions ? (
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
                {selectedRewardChain.tokens
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
          <ButtonPrimary gap="4px" disabled={claiming || !selectedRewardChain?.claimableUsdValue} onClick={handleClaim}>
            {claiming && <Loader stroke={'#505050'} />}
            {claiming ? t`Claiming` : t`Claim`}
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
