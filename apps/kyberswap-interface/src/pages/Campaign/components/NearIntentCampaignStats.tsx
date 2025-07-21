import { ChainId, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetUserRewardQuery } from 'services/campaign'
import styled from 'styled-components'

import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import NavGroup from 'components/Header/groups/NavGroup'
import useTheme from 'hooks/useTheme'
import { BitcoinConnectModal } from 'pages/CrossChainSwap/components/BitcoinConnectModal'
import { ButtonText, MEDIA_WIDTHS } from 'theme'
import { shortenHash } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { useNearIntentSelectedWallet } from '../hooks/useNearIntentSelectedWallet'
import { StatCard } from '../styles'
import { SelectChainModal } from './SelectChainModal'

const AddressText = styled(Text)`
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`

export const NearIntentCampaignStats = ({
  year,
  selectedWeek,
  reward,
  selectedWalletParams,
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
  selectedWalletParams: ReturnType<typeof useNearIntentSelectedWallet>
}) => {
  const theme = useTheme()
  const {
    selectedWallet,
    connect,
    disconnect,
    logo,
    address,
    setConnectingWallet,
    showSelect,
    setShowSelect,
    showBtcModal,
    setShowBtcConnect,
    evmWallet,
    btcAddress,
    solanaWallet,
    nearAddress,
    setSelectedWallet,
  } = selectedWalletParams

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

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
          <Flex
            width="100%"
            alignItems="center"
            sx={{ gap: '12px' }}
            flexDirection={upToSmall ? 'column' : 'row'}
            justifyContent={upToSmall ? 'flex-start' : 'space-around'}
          >
            <Flex width="100%" flex="0.8">
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
            <Flex
              flexDirection={upToSmall ? 'row' : 'column'}
              width="100%"
              sx={{ gap: '4px' }}
              justifyContent={upToSmall ? 'space-between' : 'flex-start'}
              style={{ flex: 1 }}
            >
              <Text color={theme.subText}>My Earned Points</Text>
              <Text fontSize={16} fontWeight={500}>
                {formatDisplayNumber(Math.floor(data[selectedWallet]?.point || 0), { significantDigits: 6 })}
              </Text>
            </Flex>

            <Flex
              flexDirection={upToSmall ? 'row' : 'column'}
              width="100%"
              sx={{ gap: '4px' }}
              justifyContent={upToSmall ? 'space-between' : 'flex-start'}
              style={{ flex: 1 }}
            >
              <Text color={theme.subText}>My Est. Rewards</Text>

              <Flex alignItems="center" sx={{ gap: '4px' }}>
                <img src={reward.logo} width={18} height={18} style={{ borderRadius: '50%' }} alt="" />
                <Text fontWeight={500} fontSize={16}>
                  {rewardAmount?.toSignificant(4) || '0'} {reward.symbol}
                </Text>
              </Flex>
            </Flex>
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

      <SelectChainModal showSelect={showSelect} connect={connect} setShowSelect={setShowSelect} logo={logo} />
    </StatCard>
  )
}
