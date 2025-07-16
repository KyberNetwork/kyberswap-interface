import { ChainId, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
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

import { getDateOfWeek } from '../MyDashboard'
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
            <Flex flex={1} width="100%">
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
              <Text fontSize={18} fontWeight={500}>
                {formatDisplayNumber(Math.floor(data[selectedWallet]?.totalPoint || 0), { significantDigits: 6 })}
              </Text>
            </Flex>

            <Flex
              flexDirection={upToSmall ? 'row' : 'column'}
              width="100%"
              sx={{ gap: '4px' }}
              justifyContent={upToSmall ? 'space-between' : 'flex-start'}
              style={{ flex: 1 }}
            >
              <Text color={theme.subText}>My Rewards</Text>

              <Flex alignItems="center" sx={{ gap: '4px' }}>
                <img src={reward.logo} width={20} height={20} style={{ borderRadius: '50%' }} alt="" />
                <Text fontWeight={500} fontSize={18}>
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

      <Divider mt="1rem" />

      {!upToSmall && (
        <>
          <TableHeader>
            <Text>WEEK</Text>
            <Text textAlign="right">POINTS EARNED</Text>
            <Text textAlign="right">ESTIMATED REWARDS </Text>
          </TableHeader>
          <Divider />
        </>
      )}
      {selectedWallet && data[selectedWallet]?.weeklyRewards?.length ? (
        data[selectedWallet]?.weeklyRewards.map((item, index) => {
          if (upToSmall) {
            const baseWeek = campaignConfig[CampaignType.NearIntents].baseWeek
            const date = getDateOfWeek(item.week, item.year)
            const end = getDateOfWeek(item.week + 1, item.year)
            end.setHours(end.getHours() - 1)

            return (
              <Box paddingY="1rem" sx={{ borderBottom: `1px solid ${theme.border}` }} key={index}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Text color={theme.subText}>
                    Week {item.week - baseWeek}: {dayjs(date).format('MMM DD')} - {dayjs(end).format('MMM DD')}
                  </Text>
                </Flex>

                <Flex justifyContent="space-between" alignItems="center" mt="1rem">
                  <Text color={theme.subText} fontSize={12} fontWeight={500}>
                    POINTS EARNED
                  </Text>
                  <Text textAlign="right">{formatDisplayNumber(item.point.toFixed(0), { significantDigits: 6 })}</Text>
                </Flex>

                <Flex justifyContent="space-between" alignItems="center" mt="0.5rem">
                  <Text color={theme.subText} fontSize={12} fontWeight={500}>
                    ESTIMATED REWARDS
                  </Text>
                  <Flex justifyContent="flex-end" alignItems="flex-end" sx={{ gap: '4px' }}>
                    <img src={reward.logo} width={20} height={20} style={{ borderRadius: '50%' }} alt="" />
                    <Text textAlign="right">
                      {formatDisplayNumber(
                        CurrencyAmount.fromRawAmount(
                          new Token(reward.chainId, reward.address, reward.decimals, ''),
                          item.reward.toString(),
                        ),
                        {
                          significantDigits: 4,
                        },
                      )}{' '}
                      {reward.symbol}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            )
          }
          return (
            <TableRow key={index}>
              <Text>{item.week - campaignConfig[CampaignType.NearIntents].baseWeek}</Text>
              <Text textAlign="right">{formatDisplayNumber(item.point.toFixed(0), { significantDigits: 6 })}</Text>
              <Flex alignItems="center" justifyContent="flex-end" sx={{ gap: '4px' }}>
                <img src={reward.logo} width={20} height={20} style={{ borderRadius: '50%' }} alt="" />
                <Text textAlign="right">
                  {formatDisplayNumber(
                    CurrencyAmount.fromRawAmount(
                      new Token(reward.chainId, reward.address, reward.decimals, ''),
                      item.reward.toString(),
                    ),
                    {
                      significantDigits: 4,
                    },
                  )}{' '}
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
