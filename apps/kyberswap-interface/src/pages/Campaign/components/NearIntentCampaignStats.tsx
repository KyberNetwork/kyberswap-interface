import { ChainId, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import { useGetUserRewardQuery } from 'services/campaign'
import styled from 'styled-components'

import { ReactComponent as Close } from 'assets/images/x.svg'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import NavGroup from 'components/Header/groups/NavGroup'
import { CloseIcon } from 'components/Header/web3/WalletModal'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useDisconnectWallet from 'hooks/web3/useDisconnectWallet'
import { NonEvmChainInfo } from 'pages/CrossChainSwap/adapters'
import { BitcoinConnectModal } from 'pages/CrossChainSwap/components/BitcoinConnectModal'
import { useWalletModalToggle } from 'state/application/hooks'
import { ButtonText } from 'theme'
import { shortenHash } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { StatCard } from '../styles'

const AddressText = styled(Text)`
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`

const Option = styled(Flex)`
  padding: 14px;
  border-radius: 10px;
  :hover {
    background-color: ${({ theme }) => theme.buttonBlack};
  }
`

export const NearIntentCampaignStats = ({
  year,
  selectedWeek,
  reward,
}: {
  year: number
  selectedWeek: number
  reward: {
    chainId: ChainId
    address: string
    symbol: string
    decimals: number
    logo: string
  }
}) => {
  const theme = useTheme()
  const { account: evmWallet } = useActiveWeb3React()
  const { walletInfo, availableWallets } = useBitcoinWallet()
  const { address: btcAddress } = walletInfo || {}
  const { publicKey: solanaAddress, disconnect: solanaDisconnect } = useWallet()
  const solanaWallet = solanaAddress?.toBase58() || null
  const { signedAccountId: nearAddress, signIn: nearSignIn, signOut: nearSignOut } = useWalletSelector()
  const { setVisible: setSolanaModalVisible } = useWalletModal()

  const toggleWalletModal = useWalletModalToggle()
  const [showBtcModal, setShowBtcConnect] = useState(false)
  const disconnectWallet = useDisconnectWallet()

  const [selectedWallet, setSelectedWallet] = useState<'EVM' | 'Bitcoin' | 'Solana' | 'Near' | null>(null)

  const connect = {
    EVM: () => toggleWalletModal(),
    Bitcoin: () => setShowBtcConnect(true),
    Solana: () => setSolanaModalVisible(true),
    Near: () => nearSignIn(),
  }

  const disconnect = {
    EVM: () => disconnectWallet(),
    Bitcoin: () => {
      availableWallets.find(wallet => wallet.type === walletInfo.walletType)?.disconnect?.()
    },
    Solana: () => solanaDisconnect(),
    Near: () => nearSignOut(),
  }
  const logo = {
    EVM: 'https://storage.googleapis.com/ks-setting-1d682dca/9412b9e7-161f-472e-94b2-a62d2c386ab7.png',
    Solana: NonEvmChainInfo['solana'].icon,
    Bitcoin: NonEvmChainInfo['bitcoin'].icon,
    Near: NonEvmChainInfo['near'].icon,
  }

  const address = useMemo(() => {
    return {
      EVM: evmWallet,
      Solana: solanaWallet,
      Bitcoin: btcAddress,
      Near: nearAddress,
    }
  }, [evmWallet, solanaWallet, btcAddress, nearAddress])

  useEffect(() => {
    if (selectedWallet && !address[selectedWallet]) setSelectedWallet(null)
  }, [address, selectedWallet])

  const [showSelect, setShowSelect] = useState(false)

  useEffect(() => {
    if (selectedWallet) return
    if (evmWallet) {
      setSelectedWallet('EVM')
    } else if (btcAddress) {
      setSelectedWallet('Bitcoin')
    } else if (solanaWallet) {
      setSelectedWallet('Solana')
    } else if (nearAddress) {
      setSelectedWallet('Near')
    }
  }, [evmWallet, btcAddress, solanaWallet, nearAddress, selectedWallet])

  const [connectingWallet, setConnectingWallet] = useState<'EVM' | 'Bitcoin' | 'Solana' | 'Near' | null>(null)
  useEffect(() => {
    if (!connectingWallet) return
    if (connectingWallet === 'EVM' && evmWallet) {
      setSelectedWallet('EVM')
      setConnectingWallet(null)
    }
    if (connectingWallet === 'Bitcoin' && btcAddress) {
      setSelectedWallet('Bitcoin')
      setConnectingWallet(null)
    }
    if (connectingWallet === 'Solana' && solanaWallet) {
      setSelectedWallet('Solana')
      setConnectingWallet(null)
    }
    if (connectingWallet === 'Near' && nearAddress) {
      setSelectedWallet('Near')
      setConnectingWallet(null)
    }
  }, [connectingWallet, evmWallet, btcAddress, solanaWallet, nearAddress])

  const params = {
    program: 'stip' as const,
    week: selectedWeek,
    year: year,
    campaign: 'trading-incentive' as const,
    url: 'https://kyberswap-near-intents.kyberengineering.io/api/v1',
  }

  const { data: evmData } = useGetUserRewardQuery(
    {
      ...params,
      wallet: evmWallet || '',
    },
    {
      skip: !evmWallet,
    },
  )
  const { data: btcData } = useGetUserRewardQuery(
    {
      ...params,
      wallet: btcAddress || '',
    },
    {
      skip: !btcAddress,
    },
  )

  const { data: nearData } = useGetUserRewardQuery(
    {
      ...params,
      wallet: nearAddress || '',
    },
    {
      skip: !nearAddress,
    },
  )

  const { data: solanaData } = useGetUserRewardQuery(
    {
      ...params,
      wallet: solanaWallet || '',
    },
    {
      skip: !solanaWallet,
    },
  )

  const data = {
    EVM: evmData?.data,
    Solana: solanaData?.data,
    Bitcoin: btcData?.data,
    Near: nearData?.data,
  }

  const rewardAmount =
    selectedWallet &&
    CurrencyAmount.fromRawAmount(
      new Token(reward.chainId, reward.address, reward.decimals, reward.symbol),
      data[selectedWallet]?.reward?.split('.')[0] || '0',
    )

  return (
    <StatCard>
      <Flex alignItems="center" justifyContent="space-between" height="100%">
        {selectedWallet && address[selectedWallet] ? (
          <Flex justifyContent="space-around" width="100%" alignItems="center" sx={{ gap: '8px' }}>
            <Flex flex={1.1}>
              <NavGroup
                isActive={false}
                anchor={
                  <Flex alignItems="center" sx={{ gap: '4px', color: theme.subText }}>
                    <img src={logo[selectedWallet]} width={20} height={20} alt="" style={{ borderRadius: '50%' }} />
                    <Text fontSize={14} color={theme.subText}>
                      {address[selectedWallet]?.includes('.near')
                        ? address[selectedWallet]
                        : shortenHash(address[selectedWallet] || '')}
                    </Text>
                  </Flex>
                }
                dropdownContent={
                  <Column gap="16px" padding="12px">
                    {Object.keys(logo).map(walletType => (
                      <Flex
                        key={walletType}
                        justifyContent="space-between"
                        sx={{ gap: '1.5rem' }}
                        onClick={() => {
                          if (address[walletType]) {
                            setSelectedWallet(walletType)
                          } else {
                            setConnectingWallet(walletType)
                            connect[walletType]()
                          }
                        }}
                      >
                        <Flex sx={{ gap: '6px', alignItems: 'center' }}>
                          <img
                            src={logo[walletType]}
                            width={20}
                            height={20}
                            alt={walletType}
                            style={{ borderRadius: '50%' }}
                          />
                          <AddressText color={theme.subText} fontSize={14}>
                            {address[walletType]
                              ? address[walletType]?.includes('.near')
                                ? address[walletType]
                                : shortenHash(address[walletType] || '', 4)
                              : walletType[0].toUpperCase() + walletType.slice(1)}
                          </AddressText>
                        </Flex>

                        <ButtonText
                          color={theme.primary}
                          style={{ fontSize: '14px' }}
                          onClick={e => {
                            if (address[walletType]) {
                              e.stopPropagation()
                              disconnect[walletType]()
                              if (selectedWallet === walletType) {
                                if (selectedWallet !== 'EVM' && evmWallet) {
                                  setSelectedWallet('EVM')
                                } else if (selectedWallet !== 'Bitcoin' && btcAddress) {
                                  setSelectedWallet('Bitcoin')
                                } else if (selectedWallet !== 'Solana' && solanaWallet) {
                                  setSelectedWallet('Solana')
                                } else if (selectedWallet !== 'Near' && nearAddress) {
                                  setSelectedWallet('Near')
                                } else {
                                  setSelectedWallet(null)
                                }
                              }
                            }
                          }}
                        >
                          {address[walletType] ? 'Disconnect' : 'Connect'}
                        </ButtonText>
                      </Flex>
                    ))}
                  </Column>
                }
              />
            </Flex>

            <Column gap="4px" style={{ flex: 1.3 }}>
              <Text color={theme.subText}>My Earned Points</Text>
              <Text fontSize={18} fontWeight={500}>
                {formatDisplayNumber(Math.floor(data[selectedWallet]?.point || 0), { significantDigits: 6 })}
              </Text>
            </Column>

            <Column gap="4px" style={{ flex: 1 }}>
              <Text color={theme.subText}>My Rewards</Text>

              <Flex alignItems="center" sx={{ gap: '4px' }}>
                <img src={reward.logo} width={20} height={20} style={{ borderRadius: '50%' }} alt="" />
                <Text fontWeight={500} fontSize={18}>
                  {rewardAmount?.toSignificant(4) || '0'} {reward.symbol}
                </Text>
              </Flex>
            </Column>
          </Flex>
        ) : (
          <>
            <Text fontSize={14} color={theme.subText}>
              Connect wallet to view your reward
            </Text>

            <ButtonLight width="max-content" height="36px" onClick={() => setShowSelect(true)}>
              Connect Wallet
            </ButtonLight>
          </>
        )}
      </Flex>
      <BitcoinConnectModal
        isOpen={showBtcModal}
        onDismiss={() => {
          setShowBtcConnect(false)
        }}
      />

      <Modal
        isOpen={showSelect}
        onDismiss={() => setShowSelect(false)}
        maxHeight={90}
        maxWidth={600}
        bypassScrollLock={true}
        bypassFocusLock={true}
        zindex={99999}
        width="240px"
      >
        <Flex width="100%" flexDirection="column" padding="24px">
          <RowBetween gap="20px" mb="24px">
            <Text fontSize="20px" fontWeight="500">
              Select chain
            </Text>
            <CloseIcon
              onClick={() => {
                setShowSelect(false)
              }}
            >
              <Close />
            </CloseIcon>
          </RowBetween>

          {Object.keys(logo).map(walletType => (
            <Option
              key={walletType}
              alignItems="center"
              sx={{ gap: '8px', cursor: 'pointer' }}
              role="button"
              fontWeight="500"
              onClick={() => {
                setShowSelect(false)
                connect[walletType]()
              }}
            >
              <img src={logo[walletType]} width={20} height={20} alt="" style={{ borderRadius: '50%' }} />
              <Text>{walletType}</Text>
            </Option>
          ))}
        </Flex>
      </Modal>
    </StatCard>
  )
}
