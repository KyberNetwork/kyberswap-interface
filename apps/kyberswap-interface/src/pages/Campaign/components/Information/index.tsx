import { Trans, t } from '@lingui/macro'
import { Fragment, useState } from 'react'
import { Minus, Plus, Star } from 'react-feather'
import { useMedia } from 'react-use'

import Divider from 'components/Divider'
import { ButtonIcon } from 'components/PageWrappers'
import { TERM_FILES_PATH } from 'constants/index'
import { CampaignType } from 'pages/Campaign/constants'
import { ExternalLink } from 'theme'

import { campaignInfos } from './info'

export default function Information({ type, selectedWeek }: { type: CampaignType; selectedWeek: number }) {
  const [isShowRule, setIsShowRule] = useState(true)
  const [isShowTimeline, setIsShowTimeline] = useState(true)
  const [isShowReward, setIsShowReward] = useState(true)
  const [isShowFaq, setIsShowFaq] = useState(true)
  const [isShowTc, setIsShowTc] = useState(true)
  const [showCustomSections, setShowCustomSections] = useState<Record<number, boolean>>({})

  const upTo450 = useMedia(`(max-width: 450px)`)
  const upTo400 = useMedia(`(max-width: 400px)`)

  const info = campaignInfos[type]
  const isRaffleCampaign = type === CampaignType.Raffle

  const HowToSection = info.HowTo
  const TimelineSection = info.Timeline
  const RewardsSection = info.Rewards
  const TermsSection = info.Terms
  const FaqSection = info.Faq
  const customSections = info.customSections || []

  if (!info) {
    return null
  }

  return (
    <div className="mt-5 rounded-[20px] bg-background p-6">
      <div className="flex justify-between">
        <div className="flex items-center gap-1 text-xl">
          <Star className="fill-warning text-warning" />
          {type === CampaignType.NearIntents || type === CampaignType.Raffle
            ? t`How to participate?`
            : t`How to earn points`}
        </div>

        <ButtonIcon onClick={() => setIsShowRule(prev => !prev)}>
          {!isShowRule ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </div>

      <div
        className="w-[95%] overflow-hidden pl-3.5 leading-7 text-subText transition-all duration-300"
        style={{
          maxHeight: isShowRule ? '10000px' : 0,
          opacity: isShowRule ? 1 : 0,
          marginTop: isShowRule ? '1rem' : 0,
        }}
      >
        {HowToSection({ week: selectedWeek })}
      </div>

      <Divider style={{ marginTop: '20px' }} />

      <div className="mt-5 flex justify-between">
        <div className="flex items-center gap-1 text-xl">
          {isRaffleCampaign ? t`🕑️ Timeline and Reward` : t`🕑️ Timeline`}
        </div>

        <ButtonIcon onClick={() => setIsShowTimeline(prev => !prev)}>
          {!isShowTimeline ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </div>

      <div
        className="overflow-hidden pl-3.5 leading-7 text-subText transition-all duration-300"
        style={{
          maxHeight: isShowTimeline ? '1000px' : 0,
          opacity: isShowTimeline ? 1 : 0,
          marginTop: isShowTimeline ? '1rem' : 0,
        }}
      >
        {TimelineSection({ week: selectedWeek })}
      </div>

      <Divider style={{ marginTop: '20px' }} />

      <div className="mt-5 flex justify-between">
        <div className="flex items-center gap-1 text-xl">{t`🏆 Rewards`}</div>

        <ButtonIcon onClick={() => setIsShowReward(prev => !prev)}>
          {!isShowReward ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </div>

      <div
        className="overflow-hidden pl-3.5 leading-7 text-subText transition-all duration-300"
        style={{
          maxHeight: isShowReward ? '2000px' : 0,
          opacity: isShowReward ? 1 : 0,
          marginTop: isShowReward ? '1rem' : 0,
        }}
      >
        {RewardsSection({ week: selectedWeek })}
      </div>

      {customSections.map((section, index) => {
        const isShowSection = showCustomSections[index] ?? true
        const CustomSectionContent = section.Content

        return (
          <Fragment key={index}>
            <Divider style={{ marginTop: '20px' }} />

            <div className="mt-5 flex justify-between">
              <div className="flex items-center gap-1 text-xl">{section.title}</div>

              <ButtonIcon
                onClick={() =>
                  setShowCustomSections(prev => ({
                    ...prev,
                    [index]: !(prev[index] ?? true),
                  }))
                }
              >
                {!isShowSection ? <Plus size={14} /> : <Minus size={14} />}
              </ButtonIcon>
            </div>

            <div
              className="overflow-hidden pl-3.5 leading-7 text-subText transition-all duration-300"
              style={{
                maxHeight: isShowSection ? '2000px' : 0,
                opacity: isShowSection ? 1 : 0,
                marginTop: isShowSection ? '1rem' : 0,
              }}
            >
              {CustomSectionContent({ week: selectedWeek })}
            </div>
          </Fragment>
        )
      })}

      <Divider style={{ marginTop: '20px' }} />

      <div id="terms-and-conditions" className="mt-5 flex justify-between" style={{ scrollMarginTop: 20 }}>
        <div className="flex items-center gap-1 text-xl">{t`📄 Terms & Conditions`}</div>

        <ButtonIcon onClick={() => setIsShowTc(prev => !prev)}>
          {!isShowTc ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </div>

      <div
        className="overflow-hidden pl-3.5 leading-7 text-subText transition-all duration-300"
        style={{
          maxHeight: isShowTc ? '2000px' : 0,
          opacity: isShowTc ? 1 : 0,
          marginTop: isShowTc ? '1rem' : 0,
        }}
      >
        <li>
          <Trans>
            These Terms and Conditions <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS}>({'"Terms"'})</ExternalLink>{' '}
            should be read in conjunction with the KyberSwap Terms of Use, which lay out the terms and conditions that
            apply to all KyberSwap promotional activities ({'"Campaign"'}).
          </Trans>
        </li>
        {TermsSection({ week: selectedWeek })}
      </div>

      <Divider style={{ marginTop: '20px' }} />

      <div className="mt-5 flex justify-between">
        <div className="flex items-center gap-1 text-xl">{t`❓ FAQ`}</div>

        <ButtonIcon onClick={() => setIsShowFaq(prev => !prev)}>
          {!isShowFaq ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </div>

      <div
        className="overflow-hidden pl-3.5 leading-7 text-subText transition-all duration-300"
        style={{
          maxHeight: isShowFaq ? '5000px' : 0,
          opacity: isShowFaq ? 1 : 0,
          maxWidth: upTo400 ? '300px' : upTo450 ? '350px' : undefined,
        }}
      >
        {FaqSection({ week: selectedWeek })}
      </div>
    </div>
  )
}
