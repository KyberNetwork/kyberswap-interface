import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { HTMLAttributes, forwardRef, useState } from 'react'
import { MoreHorizontal } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useGetUserWeeklyRewardQuery } from 'services/campaign'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { TokenLogoWithChain } from 'components/Logo'
import { NewLabel } from 'components/Menu'
import MenuFlyout from 'components/MenuFlyout'
import { ButtonIcon } from 'components/PageWrappers'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import ClaimButton from 'pages/Campaign/components/ClaimButton'
import NearIntentDashboard from 'pages/Campaign/components/MyDashboard/NearIntentDashboard'
import RaffleDashboard from 'pages/Campaign/components/MyDashboard/RaffleDashboard'
import SafePalDashboard from 'pages/Campaign/components/MyDashboard/SafePalDashboard'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { useNearIntentCampaignReward } from 'pages/Campaign/hooks/useNearIntentCampaignReward'
import { Tab, Tabs, Wrapper } from 'pages/Campaign/styles'
import { useWalletModalToggle } from 'state/application/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const TABLE_GRID = 'grid grid-cols-[1.5fr_1fr_1fr_1.25fr_100px] gap-4'

const TableHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn(TABLE_GRID, 'py-4 text-xs font-medium text-subText', className)} {...rest} />
))
TableHeader.displayName = 'TableHeader'

const TableRow = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn(TABLE_GRID, 'items-center text-base font-normal text-text', className)} {...rest} />
))
TableRow.displayName = 'TableRow'

const DropdownItem = ({ $active, className, ...rest }: HTMLAttributes<HTMLButtonElement> & { $active: boolean }) => (
  <button
    className={cn(
      'flex w-full cursor-pointer items-center rounded-xl border-0 bg-transparent px-3 py-2.5 text-subText',
      'hover:bg-tabActive hover:text-text',
      $active && 'bg-tabActive text-text',
      className,
    )}
    {...rest}
  />
)

export function getDateOfWeek(w: number, y: number) {
  const first = y === 2025 ? -1 : 1
  const d = first + (w - 1) * 7
  return new Date(y, 0, d)
}

const NEW_CAMPAIGN = CampaignType.SafePal
const DASHBOARD_TABS: CampaignType[] = [
  CampaignType.SafePal,
  CampaignType.Raffle,
  CampaignType.NearIntents,
  CampaignType.MayTrading,
]

const MyDashboard = () => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const [searchParams, setSearchParams] = useSearchParams()

  const searchTab = searchParams.get('tab') as CampaignType | null
  const tab = searchTab && DASHBOARD_TABS.includes(searchTab) ? searchTab : NEW_CAMPAIGN

  const changeTab = (tab: CampaignType) => {
    searchParams.set('tab', tab)
    setSearchParams(searchParams)
  }

  const { reward, baseWeek, banner } = campaignConfig[tab]

  const campaignLabelMap: Record<CampaignType, string> = {
    [CampaignType.SafePal]: t`SafePal`,
    [CampaignType.Raffle]: t`Weekly Rewards`,
    [CampaignType.NearIntents]: t`Cross Chain`,
    [CampaignType.MayTrading]: t`May Trading`,
    [CampaignType.Aggregator]: t`Trading`,
    [CampaignType.LimitOrder]: t`Limit Order`,
    [CampaignType.Referrals]: t`Referral`,
  }

  const mockToken = new Token(1, ZERO_ADDRESS, 18, 'mock')

  const mayTradingReward = campaignConfig[CampaignType.MayTrading].reward

  const rewardTokenLogo = reward.logo
  const rewardTokenSymbol = reward.symbol

  const mayTradingRewardPrice =
    useTokenPrices([mayTradingReward.address], mayTradingReward.chainId)?.[mayTradingReward.address] || 0

  const { data: mayTrading } = useGetUserWeeklyRewardQuery(
    {
      program: 'grind/base',
      campaign: 'trading-incentive',
      wallet: account || '',
    },
    { skip: !account },
  )

  const nearIntentCampaingReward = useNearIntentCampaignReward()
  const totalNearCampaignReward = Object.values(nearIntentCampaingReward).reduce(
    (acc, cur) => acc + BigInt(cur?.totalReward || 0),
    0n,
  )
  const nearCampaignReward = campaignConfig[CampaignType.NearIntents].reward
  const nearIntentReward = CurrencyAmount.fromRawAmount(
    new Token(nearCampaignReward.chainId, nearCampaignReward.address, nearCampaignReward.decimals, 'mock'),
    totalNearCampaignReward.toString(),
  )

  const data = tab === CampaignType.MayTrading ? mayTrading : undefined

  const mayTradingRw = CurrencyAmount.fromRawAmount(mockToken, mayTrading?.data?.totalReward?.split('.')[0] || '0')

  const totalMayTradingRw = formatDisplayNumber(+mayTradingRw.toExact(), { significantDigits: 6 })
  const totalMayTradingRwUsd = formatDisplayNumber(+mayTradingRw.toExact() * mayTradingRewardPrice, {
    significantDigits: 6,
    style: 'currency',
  })

  const mayTradingClaimableRw = CurrencyAmount.fromRawAmount(
    mockToken,
    account ? mayTrading?.data?.totalClaimableReward?.split('.')[0] || '0' : '0',
  )

  const totalMayTradingClaimableRw = formatDisplayNumber(+mayTradingClaimableRw.toExact(), { significantDigits: 6 })
  const toalMayTradingClaimableRwUsd = formatDisplayNumber(+mayTradingClaimableRw.toExact() * mayTradingRewardPrice, {
    significantDigits: 6,
    style: 'currency',
  })

  const totalRewardByCampaign = CurrencyAmount.fromRawAmount(mockToken, data?.data?.totalReward?.split('.')[0] || '0')
  const claimableRewardByCampaign = CurrencyAmount.fromRawAmount(
    mockToken,
    data?.data?.totalClaimableReward?.split('.')[0] || '0',
  )
  const price = mayTradingRewardPrice
  const [isOpenMenu, setIsOpenMenu] = useState(false)

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const endedCampaigns = [
    {
      type: CampaignType.Raffle,
      label: campaignLabelMap[CampaignType.Raffle],
    },
    {
      type: CampaignType.NearIntents,
      label: campaignLabelMap[CampaignType.NearIntents],
    },
    {
      type: CampaignType.MayTrading,
      label: campaignLabelMap[CampaignType.MayTrading],
    },
  ]
  const selectedEndedCampaign = endedCampaigns.find(item => item.type === tab)

  const infor = (
    <InfoHelper
      text={
        <Trans>
          The Estimated Rewards will vary based on the points earned by you and all campaign participants during the
          week. Check out how they are calculated in the <span className="font-medium text-primary">Information</span>{' '}
          tab.
        </Trans>
      }
    />
  )

  return (
    <Wrapper className="animate-[fadeInUp_0.5s_ease-out_both] motion-reduce:animate-none">
      <img src={banner} width="100%" alt="banner" className="rounded-xl" />
      <div className="my-6 flex gap-2.5">
        <div className="text-2xl font-medium">
          <Trans>My Dashboard</Trans>
        </div>
      </div>

      <div className={cn('my-6 flex gap-4', upToSmall ? 'flex-col' : 'flex-row')}>
        <div className="flex-1 rounded-[20px] px-[30px] py-5 [background-image:linear-gradient(121deg,#7177e3bf,#2C3178_104.95%)]">
          <div className="flex items-center justify-between">
            <div>
              <Trans>My Est. Rewards</Trans> {infor}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-2xl">
            <TokenLogoWithChain chainId={mayTradingReward.chainId} tokenLogo={mayTradingReward.logo} size={24} />
            <div className="ml-1.5 font-medium">
              {totalMayTradingRw} {mayTradingReward.symbol}
            </div>
            <div className="mt-0.5 text-base text-white2/50">{totalMayTradingRwUsd}</div>
          </div>
          {totalNearCampaignReward > 0n && (
            <div className="mt-2 flex items-center gap-1 text-2xl">
              <TokenLogoWithChain chainId={nearCampaignReward.chainId} tokenLogo={nearCampaignReward.logo} size={24} />
              <div className="ml-1.5 font-medium">
                {nearIntentReward.toSignificant(4)} {nearCampaignReward.symbol}
              </div>
              <div className="mt-0.5 text-base text-white2/50"></div>
            </div>
          )}
          <div className="mt-3 italic text-subText">
            <Trans>The current rewards are based on your current rank. See Information for details.</Trans>
          </div>
        </div>

        <div className="flex-1 rounded-[20px] px-[30px] py-5 [background-image:linear-gradient(309.26deg,#0E3C34_-11.46%,#28CD95_207.8%)]">
          <div>
            <Trans>My claim-able rewards</Trans>
          </div>

          <div className="mt-2 flex items-center gap-1 text-2xl">
            <TokenLogoWithChain chainId={mayTradingReward.chainId} tokenLogo={mayTradingReward.logo} size={24} />
            <div className="ml-1.5 font-medium">
              {totalMayTradingClaimableRw} {mayTradingReward.symbol}
            </div>
            <div className="mt-0.5 text-base text-white2/50">{toalMayTradingClaimableRwUsd}</div>
          </div>

          <div className="mt-3 italic text-subText">
            <Trans>Total final rewards that you can claim for the campaign.</Trans>
          </div>
        </div>
      </div>

      <Tabs>
        <Tab role="button" active={tab === NEW_CAMPAIGN} onClick={() => changeTab(NEW_CAMPAIGN)}>
          <div className="flex">
            {campaignLabelMap[NEW_CAMPAIGN]}{' '}
            <NewLabel isNew>
              <Trans>New</Trans>
            </NewLabel>
          </div>
        </Tab>
        {selectedEndedCampaign && (
          <Tab
            key={selectedEndedCampaign.type}
            role="button"
            active={true}
            onClick={() => changeTab(selectedEndedCampaign.type)}
          >
            <div className="flex">
              {selectedEndedCampaign.label}
              <span className="ml-1 text-[10px]">
                <Trans>Ended</Trans>
              </span>
            </div>
          </Tab>
        )}
        {endedCampaigns.length > 0 && (
          <div className="flex flex-1 justify-end">
            <div className="relative inline-flex items-center">
              <MenuFlyout
                isOpen={isOpenMenu}
                toggle={() => setIsOpenMenu(prev => !prev)}
                modalWhenMobile={false}
                hasArrow={false}
                className="right-0 top-[calc(100%+8px)] min-w-[240px] rounded-2xl bg-background p-2"
                trigger={
                  <ButtonIcon color={tab !== NEW_CAMPAIGN ? theme.primary : undefined}>
                    <MoreHorizontal size={16} />
                  </ButtonIcon>
                }
              >
                <div className="flex flex-col gap-1.5">
                  {endedCampaigns.map(campaign => (
                    <DropdownItem
                      key={campaign.type}
                      $active={tab === campaign.type}
                      onClick={() => {
                        changeTab(campaign.type)
                        setIsOpenMenu(false)
                      }}
                    >
                      <span className="text-inherit">{campaign.label}</span>
                    </DropdownItem>
                  ))}
                </div>
              </MenuFlyout>
            </div>
          </div>
        )}
      </Tabs>

      {!account ? (
        <div className="mt-[30px] flex flex-col items-center gap-4">
          <div className="text-center text-subText">
            <Trans>Please connect wallet to view your Dashboard</Trans>
          </div>
          <ButtonPrimary width="180px" onClick={toggleWalletModal}>
            <Trans>Connect Wallet</Trans>
          </ButtonPrimary>
        </div>
      ) : tab === CampaignType.SafePal ? (
        <SafePalDashboard />
      ) : tab === CampaignType.Raffle ? (
        <RaffleDashboard />
      ) : tab === CampaignType.NearIntents ? (
        <NearIntentDashboard />
      ) : (
        <div className="mt-5 rounded-[20px] bg-background p-6">
          <div className={cn('mb-6 grid gap-4', upToSmall ? 'grid-cols-1' : 'grid-cols-3')}>
            <div>
              <div className="text-subText">
                <Trans>Total point earned</Trans>
              </div>
              <div className="mt-2 text-lg font-medium">
                {formatDisplayNumber(Math.floor(data?.data?.totalPoint || 0), { significantDigits: 4 })}
              </div>
            </div>
            <div>
              <div className="text-subText">
                <Trans>Total est. rewards</Trans> {infor}
              </div>
              <div className="mt-2 flex items-center gap-1">
                <img
                  src={rewardTokenLogo}
                  alt={rewardTokenSymbol}
                  width="20px"
                  height="20px"
                  className="rounded-full"
                />
                <div className="text-lg font-medium">
                  {formatDisplayNumber(totalRewardByCampaign.toFixed(4), { significantDigits: 6 })} {rewardTokenSymbol}{' '}
                  <span className="text-subText">
                    {formatDisplayNumber((+totalRewardByCampaign.toExact() * price).toFixed(4), {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-subText">
                <Trans>Total Claim-able rewards</Trans>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <img
                  src={rewardTokenLogo}
                  alt={rewardTokenSymbol}
                  width="20px"
                  height="20px"
                  className="rounded-full"
                />

                <div className="text-lg font-medium">
                  {formatDisplayNumber(claimableRewardByCampaign.toFixed(4), { significantDigits: 6 })}{' '}
                  {rewardTokenSymbol}{' '}
                  <span className="text-subText">
                    {formatDisplayNumber((+claimableRewardByCampaign.toExact() * price).toFixed(4), {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Divider />

          {!upToSmall && (
            <>
              <TableHeader>
                <div>
                  <Trans>WEEK</Trans>
                </div>
                <div className="text-right">
                  <Trans>POINTS EARNED</Trans>
                </div>
                <div className="text-right">
                  <Trans>ESTIMATED REWARDS</Trans> {infor}
                </div>
                <div className="text-right">
                  <Trans>TOTAL CLAIMABLE REWARDS</Trans>
                </div>
              </TableHeader>
              <Divider />
            </>
          )}

          {!data?.data?.weeklyRewards?.length && (
            <div className="mt-6 text-center text-subText">
              <Trans>No data found</Trans>
            </div>
          )}
          {data?.data?.weeklyRewards?.map((item, idx) => {
            const rw = item.reward.split('.')[0]
            const totalRw = CurrencyAmount.fromRawAmount(mockToken, rw)

            const claimable = item.claimableReward?.split('.')?.[0] || '0'
            const claimableRw = CurrencyAmount.fromRawAmount(mockToken, claimable)
            const canClaim = claimable !== '0' && !item.isClaimed

            const date = getDateOfWeek(item.week, item.year)
            const end = getDateOfWeek(item.week + 1, item.year)
            end.setHours(end.getHours() - 1)

            if (upToSmall)
              return (
                <div className="border-b border-border py-4" key={idx}>
                  <div className="flex items-center justify-between">
                    <div className="text-subText">
                      <Trans>Week {item.week - baseWeek}:</Trans> {dayjs(date).format('MMM DD')} -{' '}
                      {dayjs(end).format('MMM DD')}
                    </div>
                    {!canClaim ? (
                      <ButtonOutlined width="88px" height="32px" disabled>
                        {item.isClaimed ? <Trans>Claimed</Trans> : <Trans>Claim</Trans>}
                      </ButtonOutlined>
                    ) : (
                      <ClaimButton info={item.claimInfo} />
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs font-medium text-subText">
                      <Trans>POINTS EARNED</Trans>
                    </div>
                    <div className="text-right">
                      {formatDisplayNumber(Math.floor(item.point), { significantDigits: 4 })}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs font-medium text-subText">
                      <Trans>ESTIMATED REWARDS</Trans> {infor}
                    </div>
                    <div className="flex flex-col items-end justify-end">
                      <div>
                        {formatDisplayNumber(totalRw.toFixed(4), { significantDigits: 6 })} {rewardTokenSymbol}
                      </div>
                      <div className="text-subText">
                        {formatDisplayNumber((+totalRw.toExact() * price).toFixed(4), {
                          significantDigits: 4,
                          style: 'currency',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs font-medium text-subText">
                      <Trans>CLAIMABLE REWARDS</Trans>
                    </div>
                    <div className="flex flex-col items-end justify-end">
                      <div>
                        {formatDisplayNumber(claimableRw.toFixed(4), { significantDigits: 6 })} {rewardTokenSymbol}
                      </div>
                      <div className="text-subText">
                        {formatDisplayNumber((+claimableRw.toExact() * price).toFixed(4), {
                          significantDigits: 4,
                          style: 'currency',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )

            return (
              <TableRow key={`${item.year}-${item.week}`}>
                <div className="text-subText">
                  <Trans>Week {item.week - baseWeek}:</Trans> {dayjs(date).format('MMM DD')} -{' '}
                  {dayjs(end).format('MMM DD')}
                </div>
                <div className="text-right">
                  {formatDisplayNumber(Math.floor(item.point * 10) / 10, { significantDigits: 4 })}
                </div>
                <div className="flex flex-col items-end justify-end">
                  <div>
                    {formatDisplayNumber(totalRw.toFixed(4), { significantDigits: 6 })} {rewardTokenSymbol}
                  </div>
                  <div className="text-subText">
                    {formatDisplayNumber((+totalRw.toExact() * price).toFixed(4), {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-end">
                  <div>
                    {formatDisplayNumber(claimableRw.toFixed(4), { significantDigits: 6 })} {rewardTokenSymbol}
                  </div>
                  <div className="text-subText">
                    {formatDisplayNumber((+claimableRw.toExact() * price).toFixed(4), {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  {!canClaim ? (
                    <ButtonOutlined width="88px" height="32px" disabled>
                      {item.isClaimed ? <Trans>Claimed</Trans> : <Trans>Claim</Trans>}
                    </ButtonOutlined>
                  ) : (
                    <ClaimButton info={item.claimInfo} />
                  )}
                </div>
              </TableRow>
            )
          })}
        </div>
      )}
    </Wrapper>
  )
}

export default MyDashboard
