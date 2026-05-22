import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useGetLeaderboardQuery, useGetUserRewardQuery } from 'services/campaign'
import { useGetDashboardQuery } from 'services/referral'

import Divider from 'components/Divider'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { useActiveWeb3React } from 'hooks'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  type: CampaignType
  selectedWeek: number
  wallet?: string
}

export default function Leaderboard({ type, selectedWeek, wallet }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = +(searchParams.get('page') || '1')

  const { campaign, program, url, year, reward } = campaignConfig[type]
  const isReferralCampaign = campaign === 'referral-program'

  const rewardAmount = (amount?: string): string => {
    const rewardAmount = CurrencyAmount.fromRawAmount(
      new Token(reward.chainId, reward.address, reward.decimals, reward.symbol),
      amount?.split('.')[0] || '0',
    )
    return rewardAmount ? rewardAmount.toSignificant(4) : '0'
  }

  const { isLoading, data } = useGetLeaderboardQuery(
    {
      program,
      week: selectedWeek,
      year,
      campaign,
      pageSize: 10,
      pageNumber: page,
      url,
    },
    { skip: isReferralCampaign },
  )

  const { account } = useActiveWeb3React()
  const { data: referralData } = useGetDashboardQuery({ referralCode: '', page }, { skip: !isReferralCampaign })

  const { data: userData } = useGetUserRewardQuery(
    {
      program,
      week: selectedWeek,
      year,
      wallet: wallet || account || '',
      campaign,
      url,
    },
    {
      skip: !wallet && !account,
    },
  )

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const showReward = [CampaignType.MayTrading, CampaignType.NearIntents].includes(type)

  return (
    <div className="mt-5 rounded-[20px] bg-background p-5 max-sm:p-4">
      {!isReferralCampaign && (
        <>
          <div className="mb-4 text-base text-subText">
            <Trans>Your rank</Trans>{' '}
            <span className="text-lg font-medium text-text">{userData?.data?.rank || '--'}</span>
          </div>

          <Divider />
        </>
      )}

      <div className="flex px-5 py-4 text-xs font-medium text-subText max-sm:px-0 max-sm:py-4">
        {!isReferralCampaign && <span className={`${upToSmall ? 'w-[30px]' : 'w-[50px]'} text-center`}>{t`RANK`}</span>}

        <span className={`flex-1 ${isReferralCampaign ? 'ml-0' : 'ml-5'}`}>{t`WALLET`}</span>

        <span className={`${isReferralCampaign ? 'w-[150px]' : 'w-[80px]'} ml-5 text-right`}>
          {isReferralCampaign ? t`NUMBER OF REFERRALS` : t`POINTS`}
        </span>

        {showReward && <span className={`${!upToSmall ? 'w-[150px]' : 'w-[80px]'} ml-5 text-right`}>{t`REWARDS`}</span>}
      </div>

      <Divider />

      {isLoading ? (
        <LocalLoader />
      ) : !isReferralCampaign ? (
        data?.data?.leaderBoards.map((item, index) => (
          <div key={item.wallet} className="flex px-5 py-4 text-sm text-text max-sm:px-0 max-sm:py-4">
            <span className={`${upToSmall ? 'w-[30px]' : 'w-[50px]'} text-center font-medium`}>
              {index + (page - 1) * 10 + 1}
            </span>

            <span className="ml-5 flex-1 overflow-hidden font-medium">
              {upToSmall ? `${item.wallet.substring(0, 4 + 2)}...${item.wallet.substring(42 - 4)}` : item.wallet}
            </span>

            <span className="ml-5 w-[70px] text-right">
              {formatDisplayNumber(Math.floor(item.point), { significantDigits: 4 })}
            </span>

            {showReward && (
              <span className={`ml-5 ${!upToSmall ? 'w-[150px]' : 'w-[70px]'} text-right`}>
                {formatDisplayNumber(rewardAmount(item.reward), { significantDigits: 4 })} {reward.symbol}
              </span>
            )}
          </div>
        ))
      ) : (
        referralData?.data.referrals.map(item => {
          return (
            <div key={item.id} className="flex p-5 text-sm text-subText">
              <span className="flex-1 overflow-hidden font-medium">
                {upToSmall
                  ? `${item.walletAddress.substring(0, 4 + 2)}...${item.walletAddress.substring(42 - 4)}`
                  : item.walletAddress}
              </span>

              <span className="ml-5 w-[100px] text-right font-medium">
                {formatDisplayNumber(item.referralsNumber, { significantDigits: 6 })}
              </span>
            </div>
          )
        })
      )}

      {!isLoading && (isReferralCampaign ? !referralData?.data.referrals.length : !data?.data?.leaderBoards.length) && (
        <div className="mt-6 p-6 text-center text-subText">{t`No data found`}</div>
      )}

      {!isLoading && (
        <Pagination
          onPageChange={p => {
            searchParams.set('page', p.toString())
            setSearchParams(searchParams)
          }}
          totalCount={
            (isReferralCampaign ? referralData?.data.pagination.totalItems : data?.data?.participantCount) || 0
          }
          currentPage={page}
          pageSize={10}
        />
      )}
    </div>
  )
}
