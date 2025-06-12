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

// const fakeData = [
//   {
//     chainId: 56,
//     chainName: 'BNB Chain',
//     chainLogo:
//       'https://storage.googleapis.com/ks-setting-1d682dca/14c1b7c4-b66e-4169-b82e-ea6237f15b461699420601184.png',
//     claimableUsdValue: 1987.65,
//     tokens: [
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/72f65ba0-66c0-45ec-b46b-7b7ec80ca5051696326694583.png',
//         symbol: 'KNC',
//         claimableAmount: 237.56,
//         claimableUsdValue: 240,
//         address: '0x28fe69Ff6864C1C218878BDCA01482D36B9D57b1',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/35f59a55-3d73-466e-80b0-2100213436d51748332616256.png',
//         symbol: 'USDT',
//         claimableAmount: 80,
//         claimableUsdValue: 80,
//         address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/90bc5afa-3ea2-4cb3-8e76-9d4dff085b761693939652735.png',
//         symbol: 'USDC',
//         claimableAmount: 60,
//         claimableUsdValue: 60,
//         address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/5eb059a4-8c6c-4377-965e-2571077249931713784151226.png',
//         symbol: 'Cake',
//         claimableAmount: 172.67,
//         claimableUsdValue: 20,
//         address: '0x3055913c90Fcc1A6CE9a358911721eEb942013A1',
//       },
//     ],
//   },
//   {
//     chainId: 137,
//     chainName: 'Polygon',
//     chainLogo:
//       'https://storage.googleapis.com/ks-setting-1d682dca/369ad098-9f91-4827-92f9-ba18ece467dd1699540645337.png',
//     claimableUsdValue: 400,
//     tokens: [
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/72f65ba0-66c0-45ec-b46b-7b7ec80ca5051696326694583.png',
//         symbol: 'KNC',
//         claimableAmount: 237.56,
//         claimableUsdValue: 240,
//         address: '0x28fe69Ff6864C1C218878BDCA01482D36B9D57b1',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/35f59a55-3d73-466e-80b0-2100213436d51748332616256.png',
//         symbol: 'USDT',
//         claimableAmount: 80,
//         claimableUsdValue: 80,
//         address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/90bc5afa-3ea2-4cb3-8e76-9d4dff085b761693939652735.png',
//         symbol: 'USDC',
//         claimableAmount: 60,
//         claimableUsdValue: 60,
//         address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/5eb059a4-8c6c-4377-965e-2571077249931713784151226.png',
//         symbol: 'Cake',
//         claimableAmount: 172.67,
//         claimableUsdValue: 20,
//         address: '0x3055913c90Fcc1A6CE9a358911721eEb942013A1',
//       },
//     ],
//   },
//   {
//     chainId: 8453,
//     chainName: 'Base',
//     chainLogo:
//       'https://storage.googleapis.com/ks-setting-1d682dca/a57f3983-8573-4f43-8b4c-f5217aee72b11697621136693.png',
//     claimableUsdValue: 276.87,
//     tokens: [
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/72f65ba0-66c0-45ec-b46b-7b7ec80ca5051696326694583.png',
//         symbol: 'KNC',
//         claimableAmount: 237.56,
//         claimableUsdValue: 240,
//         address: '0x28fe69Ff6864C1C218878BDCA01482D36B9D57b1',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/35f59a55-3d73-466e-80b0-2100213436d51748332616256.png',
//         symbol: 'USDT',
//         claimableAmount: 80,
//         claimableUsdValue: 80,
//         address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/90bc5afa-3ea2-4cb3-8e76-9d4dff085b761693939652735.png',
//         symbol: 'USDC',
//         claimableAmount: 60,
//         claimableUsdValue: 60,
//         address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/5eb059a4-8c6c-4377-965e-2571077249931713784151226.png',
//         symbol: 'Cake',
//         claimableAmount: 172.67,
//         claimableUsdValue: 20,
//         address: '0x3055913c90Fcc1A6CE9a358911721eEb942013A1',
//       },
//     ],
//   },
//   {
//     chainId: 1,
//     chainName: 'Ethereum',
//     chainLogo:
//       'https://storage.googleapis.com/ks-setting-1d682dca/fd07cf5c-3ddf-4215-aa51-e6ee2c60afbc1697031732146.png',
//     claimableUsdValue: 42.26,
//     tokens: [
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/72f65ba0-66c0-45ec-b46b-7b7ec80ca5051696326694583.png',
//         symbol: 'KNC',
//         claimableAmount: 237.56,
//         claimableUsdValue: 240,
//         address: '0x28fe69Ff6864C1C218878BDCA01482D36B9D57b1',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/35f59a55-3d73-466e-80b0-2100213436d51748332616256.png',
//         symbol: 'USDT',
//         claimableAmount: 80,
//         claimableUsdValue: 80,
//         address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/90bc5afa-3ea2-4cb3-8e76-9d4dff085b761693939652735.png',
//         symbol: 'USDC',
//         claimableAmount: 60,
//         claimableUsdValue: 60,
//         address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/5eb059a4-8c6c-4377-965e-2571077249931713784151226.png',
//         symbol: 'Cake',
//         claimableAmount: 172.67,
//         claimableUsdValue: 20,
//         address: '0x3055913c90Fcc1A6CE9a358911721eEb942013A1',
//       },
//     ],
//   },
//   {
//     chainId: 42161,
//     chainName: 'Arbitrum',
//     chainLogo: 'https://storage.googleapis.com/ks-setting-1d682dca/e123a120-6556-4a72-83c8-af4cce475e43.png',
//     claimableUsdValue: 7.4,
//     tokens: [
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/72f65ba0-66c0-45ec-b46b-7b7ec80ca5051696326694583.png',
//         symbol: 'KNC',
//         claimableAmount: 237.56,
//         claimableUsdValue: 240,
//         address: '0x28fe69Ff6864C1C218878BDCA01482D36B9D57b1',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/35f59a55-3d73-466e-80b0-2100213436d51748332616256.png',
//         symbol: 'USDT',
//         claimableAmount: 80,
//         claimableUsdValue: 80,
//         address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/90bc5afa-3ea2-4cb3-8e76-9d4dff085b761693939652735.png',
//         symbol: 'USDC',
//         claimableAmount: 60,
//         claimableUsdValue: 60,
//         address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
//       },
//       {
//         logo: 'https://storage.googleapis.com/ks-setting-1d682dca/5eb059a4-8c6c-4377-965e-2571077249931713784151226.png',
//         symbol: 'Cake',
//         claimableAmount: 172.67,
//         claimableUsdValue: 20,
//         address: '0x3055913c90Fcc1A6CE9a358911721eEb942013A1',
//       },
//     ],
//   },
// ]

export default function ClaimAllModal({ rewardInfo, onClose }: { rewardInfo: RewardInfo; onClose: () => void }) {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { library, chainId } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const [autoClaim, setAutoClaim] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)
  const [claiming, _setClaiming] = useState(false)

  const selectedChain = selectedChainId ? rewardInfo.chains.find(c => c.chainId === selectedChainId) : null

  const handleClaim = useCallback(async () => {
    if (!library || !selectedChainId) return
    const accounts = await library.listAccounts()
    if (chainId !== selectedChainId || !accounts.length) {
      if (chainId !== selectedChainId) changeNetwork(selectedChainId)
      setAutoClaim(true)
      return
    }

    // TODO: Claim rewards
  }, [chainId, changeNetwork, library, selectedChainId])

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
              {formatDisplayNumber(rewardInfo.claimableUsdValue, { significantDigits: 6, style: 'currency' })}
            </Text>
          </Flex>

          <Flex flexDirection={'column'} sx={{ gap: 1 }}>
            {rewardInfo.chains.map(chain => {
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
                      {formatDisplayNumber(chain.claimableUsdValue, { significantDigits: 6, style: 'currency' })}
                    </Text>
                  </Flex>
                  <ChainDetailInfo isOpen={isSelected}>
                    {chain.tokens.map(token => (
                      <Flex key={token.address} alignItems={'center'} justifyContent={'space-between'}>
                        <Flex alignItems={'center'} sx={{ gap: 1 }}>
                          <TokenLogo src={token.logo} size={16} alt={token.symbol} />
                          <TokenLogo
                            src={chain.chainLogo}
                            size={10}
                            alt={chain.chainName}
                            style={{ position: 'relative', top: 4, border: `1px solid ${theme.black}` }}
                          />
                          <Text marginLeft={1}>
                            {formatDisplayNumber(token.claimableAmount, { significantDigits: 6 })}
                          </Text>
                          <Text>{token.symbol}</Text>
                        </Flex>
                        <Text color={theme.subText}>
                          {formatDisplayNumber(token.claimableUsdValue, { significantDigits: 6, style: 'currency' })}
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
        <Row gap="16px" flexDirection={upToExtraSmall ? 'column' : 'row'}>
          <ButtonOutlined onClick={onClose}>{t`Cancel`}</ButtonOutlined>
          <ButtonPrimary gap="4px" disabled={claiming} onClick={handleClaim}>
            {claiming && <Loader stroke={'#505050'} />}
            {claiming ? t`Claiming` : t`Claim`}
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
