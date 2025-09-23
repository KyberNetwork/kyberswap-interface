import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
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
import { ChainDetailInfo, ChainRewardItem, CustomRadio } from 'pages/Earns/components/ClaimAllModal/styles'
import { ClaimInfoWrapper, ModalHeader, Wrapper, X } from 'pages/Earns/components/ClaimModal/styles'
import { RewardInfo } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export default function ClaimAllModal({
  rewardInfo,
  onClose,
  claiming,
  setClaiming,
  onClaimAll,
}: {
  rewardInfo: RewardInfo
  onClose: () => void
  claiming: boolean
  setClaiming: (claiming: boolean) => void
  onClaimAll: () => void
}) {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { library, chainId } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const [autoClaim, setAutoClaim] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)

  const selectedChain = selectedChainId ? rewardInfo.chains.find(c => c.chainId === selectedChainId) : null

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
    if (chainId === selectedChainId) setSelectedChainId(null)
    else setSelectedChainId(chainId)
  }

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
    <Modal isOpen onDismiss={onClose}>
      <Wrapper>
        <ModalHeader>
          <Text fontSize={20} fontWeight={500}>
            {t`Claim Rewards`}
          </Text>
          <X onClick={onClose} />
        </ModalHeader>
        <ClaimInfoWrapper>
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
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      style={{ cursor: 'pointer' }}
                      paddingTop={12}
                      paddingBottom={12}
                      onClick={() => handleSelectChain(chain.chainId)}
                    >
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
                    </Flex>
                    <ChainDetailInfo isOpen={isSelected}>
                      {chain.tokens
                        .sort((a, b) => b.claimableUsdValue - a.claimableUsdValue)
                        .map(token => (
                          <Flex key={token.address} alignItems={'center'} justifyContent={'space-between'}>
                            <Flex alignItems={'center'} sx={{ gap: 1 }}>
                              <TokenLogo src={token.logo} size={16} alt={token.symbol} />
                              <TokenLogo
                                src={chain.chainLogo}
                                size={10}
                                alt={chain.chainName}
                                translateLeft
                                style={{ position: 'relative', top: 4, border: `1px solid ${theme.black}` }}
                              />
                              <Text marginLeft={1}>
                                {formatDisplayNumber(token.claimableAmount, { significantDigits: 4 })}
                              </Text>
                              <Text>{token.symbol}</Text>
                            </Flex>
                            <Text color={theme.subText}>
                              {formatDisplayNumber(token.claimableUsdValue, {
                                significantDigits: 4,
                                style: 'currency',
                              })}
                            </Text>
                          </Flex>
                        ))}
                    </ChainDetailInfo>
                  </ChainRewardItem>
                )
              })}
          </Flex>

          {selectedChain ? (
            <Flex marginTop={2} flexWrap={'wrap'} color={theme.subText} alignItems={'center'} sx={{ gap: 1 }}>
              <Text>{t`You are currently claiming`}</Text>
              <Text color={theme.text}>
                {formatDisplayNumber(selectedChain.claimableUsdValue, { significantDigits: 4, style: 'currency' })}
              </Text>
              <Text>{t`on`}</Text>
              <Text>{selectedChain.chainName}</Text>
            </Flex>
          ) : (
            <Text mt={2} color={theme.subText}>{t`Please select a chain to claim rewards`}</Text>
          )}
        </ClaimInfoWrapper>
        <Row gap="16px" flexDirection={upToExtraSmall ? 'column-reverse' : 'row'}>
          <ButtonOutlined onClick={onClose}>{t`Cancel`}</ButtonOutlined>
          <ButtonPrimary gap="4px" disabled={claiming || !selectedChain} onClick={handleClaim}>
            {claiming && <Loader stroke={'#505050'} />}
            {claiming ? t`Claiming` : t`Claim`}
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
