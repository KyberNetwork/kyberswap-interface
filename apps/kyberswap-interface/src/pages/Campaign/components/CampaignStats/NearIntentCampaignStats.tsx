import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'
import { useGetUserRewardQuery } from 'services/campaign'

import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import NavGroup from 'components/Header/groups/NavGroup'
import { SelectChainModal } from 'pages/Campaign/components/SelectChainModal'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { useNearIntentSelectedWallet } from 'pages/Campaign/hooks/useNearIntentSelectedWallet'
import { StatCard } from 'pages/Campaign/styles'
import { BitcoinConnectModal } from 'pages/CrossChainSwap/components/BitcoinConnectModal'
import { ButtonText, MEDIA_WIDTHS } from 'theme'
import { shortenHash } from 'utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const NearIntentCampaignStats = ({ selectedWeek }: { selectedWeek: number }) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { year, reward } = campaignConfig[CampaignType.NearIntents]

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

  const params = {
    program: 'stip' as const,
    week: selectedWeek,
    year: year,
    campaign: 'trading-incentive' as const,
    url: 'https://kyberswap-near-intents.kyberengineering.io/api/v1',
  }

  const { data: evmData } = useGetUserRewardQuery({ ...params, wallet: evmWallet || '' }, { skip: !evmWallet })
  const { data: btcData } = useGetUserRewardQuery({ ...params, wallet: btcAddress || '' }, { skip: !btcAddress })
  const { data: nearData } = useGetUserRewardQuery({ ...params, wallet: nearAddress || '' }, { skip: !nearAddress })
  const { data: solanaData } = useGetUserRewardQuery({ ...params, wallet: solanaWallet || '' }, { skip: !solanaWallet })

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
      {termAndPolicyModal}
      <div className="flex h-full items-center justify-between">
        {selectedWallet && address[selectedWallet] ? (
          <div
            className={cn(
              'flex w-full items-center gap-3',
              upToSmall ? 'flex-col justify-start' : 'flex-row justify-around',
            )}
          >
            <div className="flex w-full flex-[0.8]">
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
                  <Column gap="16px" className="p-3">
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
                          style={{ fontSize: '14px', color: 'var(--ks-primary)' }}
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
                'flex w-full flex-1 gap-1',
                upToSmall ? 'flex-row justify-between' : 'flex-col justify-start',
              )}
            >
              <span className="text-subText">
                <Trans>My Earned Points</Trans>
              </span>
              <span className="text-base font-medium">
                {formatDisplayNumber(Math.floor(data[selectedWallet]?.point || 0), { significantDigits: 6 })}
              </span>
            </div>

            <div
              className={cn(
                'flex w-full flex-1 gap-1',
                upToSmall ? 'flex-row justify-between' : 'flex-col justify-start',
              )}
            >
              <span className="text-subText">
                <Trans>My Est. Rewards</Trans>
              </span>

              <div className="flex items-center gap-1">
                <img src={reward.logo} width={18} height={18} style={{ borderRadius: '50%' }} alt="" />
                <span className="text-base font-medium">
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

            <ButtonLight onClick={() => setShowSelect(true)} className="!h-9 w-max">
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
    </StatCard>
  )
}

export default NearIntentCampaignStats
