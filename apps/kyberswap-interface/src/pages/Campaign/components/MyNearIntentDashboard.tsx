import { ChainId, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import Divider from 'components/Divider'
import NavGroup from 'components/Header/groups/NavGroup'
import useTheme from 'hooks/useTheme'
import { BitcoinConnectModal } from 'pages/CrossChainSwap/components/BitcoinConnectModal'
import { ButtonText, MEDIA_WIDTHS } from 'theme'
import { shortenHash } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { CampaignType, campaignConfig } from '../constants'
import { useNearIntentCampaignReward } from '../hooks/useNearIntentCampaignReward'
import { useNearIntentSelectedWallet } from '../hooks/useNearIntentSelectedWallet'
import { SelectChainModal } from './SelectChainModal'

const AddressText = styled(Text)`
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`
const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 40px 2fr 2fr;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  padding: 1rem 0;
  gap: 1rem;
  font-weight: 500;
`

const TableRow = styled(TableHeader)`
  font-size: 1rem;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  align-items: center;
`

export const MyNearIntentDashboard = ({
  reward,
}: {
  reward: { logo: string; decimals: number; symbol: string; address: string; chainId: ChainId }
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
  } = useNearIntentSelectedWallet()

  const data = useNearIntentCampaignReward()

  const rewardAmount =
    selectedWallet &&
    CurrencyAmount.fromRawAmount(
      new Token(reward.chainId, reward.address, reward.decimals, reward.symbol),
      data[selectedWallet]?.totalReward?.split('.')[0] || '0',
    )

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <Box marginTop="1.25rem" sx={{ borderRadius: '20px', background: theme.background }} padding="1.5rem">
      <Flex alignItems="center" justifyContent="space-between" height="100%">
        {selectedWallet && address[selectedWallet] ? (
          <Flex
            width="100%"
            alignItems="center"
            sx={{ gap: '8px' }}
            flexDirection={upToSmall ? 'column' : 'row'}
            justifyContent={upToSmall ? 'flex-start' : 'space-around'}
          >
            <Flex flex={1.1} justifyContent="flex-start">
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

            <Flex flex={2} justifyContent="space-between" alignItems="center" sx={{ gap: '8px' }} width="100%">
              <Column gap="4px" style={{ flex: 1.3 }}>
                <Text color={theme.subText}>My Earned Points</Text>
                <Text fontSize={18} fontWeight={500}>
                  {formatDisplayNumber(Math.floor(data[selectedWallet]?.totalPoint || 0), { significantDigits: 6 })}
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

      <Divider mt="1rem" />
      <TableHeader>
        <Text>WEEK</Text>
        <Text textAlign="right">POINTS EARNED</Text>
        <Text textAlign="right">ESTIMATED REWARDS </Text>
      </TableHeader>
      <Divider />
      {selectedWallet && data[selectedWallet]?.weeklyRewards?.length ? (
        data[selectedWallet]?.weeklyRewards.map((item, index) => {
          return (
            <TableRow key={index}>
              <Text>{item.week - campaignConfig[CampaignType.NearIntents].baseWeek}</Text>
              <Text textAlign="right">{formatDisplayNumber(item.point.toString(), { significantDigits: 6 })}</Text>
              <Flex alignItems="center" justifyContent="flex-end" sx={{ gap: '4px' }}>
                <img src={reward.logo} width={20} height={20} style={{ borderRadius: '50%' }} alt="" />
                <Text textAlign="right">
                  {formatDisplayNumber(BigInt(item.reward.toString()) / 10n ** BigInt(reward.decimals), {
                    significantDigits: 6,
                  })}{' '}
                  {reward.symbol}
                </Text>
              </Flex>
            </TableRow>
          )
        })
      ) : (
        <Text textAlign="center" color={theme.subText} mt="24px">
          No data found
        </Text>
      )}
    </Box>
  )
}
