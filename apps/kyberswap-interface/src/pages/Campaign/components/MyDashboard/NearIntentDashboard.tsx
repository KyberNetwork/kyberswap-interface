import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMedia } from 'react-use'

import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import Divider from 'components/Divider'
import NavGroup from 'components/Header/groups/NavGroup'
import { getDateOfWeek } from 'pages/Campaign/MyDashboard'
import { SelectChainModal } from 'pages/Campaign/components/SelectChainModal'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { useNearIntentCampaignReward } from 'pages/Campaign/hooks/useNearIntentCampaignReward'
import { useNearIntentSelectedWallet } from 'pages/Campaign/hooks/useNearIntentSelectedWallet'
import { BitcoinConnectModal } from 'pages/CrossChainSwap/components/BitcoinConnectModal'
import { ButtonText, MEDIA_WIDTHS } from 'theme'
import { shortenHash } from 'utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const tableGridClass = 'grid grid-cols-[40px_2fr_2fr] gap-4'

const NearIntentDashboard = () => {
  const { reward } = campaignConfig[CampaignType.NearIntents]

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
    termAndPolicyModal,
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
    <div className="mt-5 rounded-[20px] bg-background p-6">
      {termAndPolicyModal}
      <div className="flex h-full min-h-[49px] items-center justify-between">
        {selectedWallet && address[selectedWallet] ? (
          <div
            className={cn(
              'flex w-full items-center gap-2',
              upToSmall ? 'flex-col justify-start' : 'flex-row justify-around',
            )}
          >
            <div className="flex w-full flex-1">
              <NavGroup
                isActive={false}
                anchor={
                  <div className="flex items-center gap-1 text-subText">
                    <img src={logo[selectedWallet]} width={20} height={20} alt="" style={{ borderRadius: '50%' }} />
                    <span className="text-sm text-subText">
                      {address[selectedWallet]?.includes('.near')
                        ? address[selectedWallet]
                        : shortenHash(address[selectedWallet] || '')}
                    </span>
                  </div>
                }
                dropdownContent={
                  <Column className="gap-4 p-3">
                    {Object.keys(logo).map(walletType => (
                      <div
                        key={walletType}
                        className="flex justify-between gap-6"
                        onClick={() => {
                          if (address[walletType]) {
                            setSelectedWallet(walletType)
                          } else {
                            setConnectingWallet(walletType)
                            connect[walletType]()
                          }
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <img
                            src={logo[walletType]}
                            width={20}
                            height={20}
                            alt={walletType}
                            style={{ borderRadius: '50%' }}
                          />
                          <span className="text-sm text-subText hover:text-primary">
                            {address[walletType]
                              ? address[walletType]?.includes('.near')
                                ? address[walletType]
                                : shortenHash(address[walletType] || '', 4)
                              : walletType[0].toUpperCase() + walletType.slice(1)}
                          </span>
                        </div>

                        <ButtonText
                          className="text-primary"
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
                          {address[walletType] ? <Trans>Disconnect</Trans> : <Trans>Connect</Trans>}
                        </ButtonText>
                      </div>
                    ))}
                  </Column>
                }
              />
            </div>

            <div
              className={cn(
                'flex w-full flex-1 gap-2',
                upToSmall ? 'flex-row justify-between' : 'flex-col justify-start',
              )}
            >
              <span className="text-subText">
                <Trans>My Earned Points</Trans>
              </span>
              <span className="text-lg font-medium">
                {formatDisplayNumber(Math.floor(data[selectedWallet]?.totalPoint || 0), { significantDigits: 6 })}
              </span>
            </div>

            <div
              className={cn(
                'flex w-full flex-1 gap-2',
                upToSmall ? 'flex-row justify-between' : 'flex-col justify-start',
              )}
            >
              <span className="text-subText">
                <Trans>My Est. Rewards</Trans>
              </span>

              <div className="flex items-center gap-1">
                <img src={reward.logo} width={20} height={20} style={{ borderRadius: '50%' }} alt="" />
                <span className="text-lg font-medium">
                  {rewardAmount?.toSignificant(4) || '0'} {reward.symbol}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <span className="text-sm text-subText">
              <Trans>Connect wallet to view your reward</Trans>
            </span>

            <ButtonLight width="max-content" height="36px" onClick={() => setShowSelect(true)}>
              <Trans>Connect Wallet</Trans>
            </ButtonLight>
          </>
        )}
      </div>
      <BitcoinConnectModal
        isOpen={showBtcModal}
        onDismiss={() => {
          setShowBtcConnect(false)
        }}
      />

      <SelectChainModal showSelect={showSelect} connect={connect} setShowSelect={setShowSelect} logo={logo} />

      <Divider className="mt-6" />

      {!upToSmall && (
        <>
          <div className={cn(tableGridClass, 'py-4 text-xs font-medium text-subText')}>
            <span>
              <Trans>WEEK</Trans>
            </span>
            <span className="text-right">
              <Trans>POINTS EARNED</Trans>
            </span>
            <span className="text-right">
              <Trans>ESTIMATED REWARDS</Trans>{' '}
            </span>
          </div>
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
              <div className="border-b border-border py-4" key={index}>
                <div className="flex items-center justify-between">
                  <span className="text-subText">
                    <Trans>Week {item.week - baseWeek}:</Trans> {dayjs(date).format('MMM DD')} -{' '}
                    {dayjs(end).format('MMM DD')}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-subText">
                    <Trans>POINTS EARNED</Trans>
                  </span>
                  <span className="text-right">
                    {formatDisplayNumber(Math.floor(item.point), { significantDigits: 6 })}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-subText">
                    <Trans>ESTIMATED REWARDS</Trans>
                  </span>
                  <div className="flex items-end justify-end gap-1">
                    <img src={reward.logo} width={20} height={20} style={{ borderRadius: '50%' }} alt="" />
                    <span className="text-right">
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
                    </span>
                  </div>
                </div>
              </div>
            )
          }
          return (
            <div className={cn(tableGridClass, 'items-center text-base font-normal text-text')} key={index}>
              <span>{item.week - campaignConfig[CampaignType.NearIntents].baseWeek}</span>
              <span className="text-right">
                {formatDisplayNumber(Math.floor(item.point), { significantDigits: 6 })}
              </span>
              <div className="flex items-center justify-end gap-1">
                <img src={reward.logo} width={20} height={20} style={{ borderRadius: '50%' }} alt="" />
                <span className="text-right">
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
                </span>
              </div>
            </div>
          )
        })
      ) : (
        <span className="mt-6 block text-center text-subText">
          <Trans>No data found</Trans>
        </span>
      )}
    </div>
  )
}

export default NearIntentDashboard
