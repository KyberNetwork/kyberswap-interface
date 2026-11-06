import { Trans, t } from '@lingui/macro'
import { Fragment, useState } from 'react'
import { Minus, Plus, Star } from 'react-feather'
import { useMedia } from 'react-use'

import { Collapse } from 'components/Collapse'
import Divider from 'components/Divider'
import { ButtonIcon } from 'components/PageWrappers'
import { TERMS_OF_USE } from 'constants/index'
import { campaignInfos } from 'pages/Campaign/components/Information/info'
import { CampaignType } from 'pages/Campaign/constants'
import { ExternalLink } from 'theme'

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

      <Collapse open={isShowRule} className="w-[95%] duration-300" contentGap={4}>
        <div className="pl-3.5 leading-7 text-subText">{HowToSection({ week: selectedWeek })}</div>
      </Collapse>

      <Divider style={{ marginTop: '20px' }} />

      <div className="mt-5 flex justify-between">
        <div className="flex items-center gap-1 text-xl">
          {isRaffleCampaign ? t`🕑️ Timeline and Reward` : t`🕑️ Timeline`}
        </div>

        <ButtonIcon onClick={() => setIsShowTimeline(prev => !prev)}>
          {!isShowTimeline ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </div>

      <Collapse open={isShowTimeline} className="duration-300" contentGap={4}>
        <div className="pl-3.5 leading-7 text-subText">{TimelineSection({ week: selectedWeek })}</div>
      </Collapse>

      <Divider style={{ marginTop: '20px' }} />

      <div className="mt-5 flex justify-between">
        <div className="flex items-center gap-1 text-xl">{t`🏆 Rewards`}</div>

        <ButtonIcon onClick={() => setIsShowReward(prev => !prev)}>
          {!isShowReward ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </div>

      <Collapse open={isShowReward} className="duration-300" contentGap={4}>
        <div className="pl-3.5 leading-7 text-subText">{RewardsSection({ week: selectedWeek })}</div>
      </Collapse>

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

            <Collapse open={isShowSection} className="duration-300" contentGap={4}>
              <div className="pl-3.5 leading-7 text-subText">{CustomSectionContent({ week: selectedWeek })}</div>
            </Collapse>
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

      <Collapse open={isShowTc} className="duration-300" contentGap={4}>
        <div className="pl-3.5 leading-7 text-subText">
          <li>
            <Trans>
              These Terms and Conditions <ExternalLink href={TERMS_OF_USE.file}>({'"Terms"'})</ExternalLink> should be
              read in conjunction with the KyberSwap Terms of Use, which lay out the terms and conditions that apply to
              all KyberSwap promotional activities ({'"Campaign"'}).
            </Trans>
          </li>
          {TermsSection({ week: selectedWeek })}
        </div>
      </Collapse>

      <Divider style={{ marginTop: '20px' }} />

      <div className="mt-5 flex justify-between">
        <div className="flex items-center gap-1 text-xl">{t`❓ FAQ`}</div>

        <ButtonIcon onClick={() => setIsShowFaq(prev => !prev)}>
          {!isShowFaq ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </div>

      <Collapse open={isShowFaq} className="duration-300">
        <div
          className="pl-3.5 leading-7 text-subText"
          style={{ maxWidth: upTo400 ? '300px' : upTo450 ? '350px' : undefined }}
        >
          {FaqSection({ week: selectedWeek })}
        </div>
      </Collapse>
    </div>
  )
}
