import { Trans, t } from '@lingui/macro'
import { Fragment, useState } from 'react'
import { Minus, Plus, Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import Divider from 'components/Divider'
import useTheme from 'hooks/useTheme'
import { CampaignType } from 'pages/Campaign/constants'
import { ButtonIcon } from 'pages/Pools/styleds'
import { ExternalLink } from 'theme'

import { campaignInfos } from './info'

export default function Information({ type, selectedWeek }: { type: CampaignType; selectedWeek: number }) {
  const theme = useTheme()
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
    <Box
      marginTop="1.25rem"
      padding="1.5rem"
      sx={{
        background: theme.background,
        borderRadius: '20px',
      }}
    >
      <Flex justifyContent="space-between">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          <Star color={theme.warning} fill={theme.warning} />
          {type === CampaignType.NearIntents || type === CampaignType.Raffle
            ? t`How to participate?`
            : t`How to earn points`}
        </Flex>

        <ButtonIcon onClick={() => setIsShowRule(prev => !prev)}>
          {!isShowRule ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </Flex>

      <Box
        color={theme.subText}
        lineHeight="28px"
        paddingLeft="14px"
        width="95%"
        sx={{
          maxHeight: isShowRule ? '10000px' : 0,
          opacity: isShowRule ? 1 : 0,
          marginTop: isShowRule ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {HowToSection({ week: selectedWeek })}
      </Box>

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          {isRaffleCampaign ? t`🕑️ Timeline and Reward` : t`🕑️ Timeline`}
        </Flex>

        <ButtonIcon onClick={() => setIsShowTimeline(prev => !prev)}>
          {!isShowTimeline ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </Flex>

      <Box
        color={theme.subText}
        lineHeight="28px"
        paddingLeft="14px"
        sx={{
          maxHeight: isShowTimeline ? '1000px' : 0,
          opacity: isShowTimeline ? 1 : 0,
          marginTop: isShowTimeline ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {TimelineSection({ week: selectedWeek })}
      </Box>

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          {t`🏆 Rewards`}
        </Flex>

        <ButtonIcon onClick={() => setIsShowReward(prev => !prev)}>
          {!isShowReward ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </Flex>

      <Text
        color={theme.subText}
        lineHeight="28px"
        paddingLeft="14px"
        sx={{
          maxHeight: isShowReward ? '2000px' : 0,
          opacity: isShowReward ? 1 : 0,
          marginTop: isShowReward ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {RewardsSection({ week: selectedWeek })}
      </Text>

      {customSections.map((section, index) => {
        const isShowSection = showCustomSections[index] ?? true
        const CustomSectionContent = section.Content

        return (
          <Fragment key={index}>
            <Divider style={{ marginTop: '20px' }} />

            <Flex justifyContent="space-between" marginTop="20px">
              <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
                {section.title}
              </Flex>

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
            </Flex>

            <Text
              color={theme.subText}
              lineHeight="28px"
              paddingLeft="14px"
              sx={{
                maxHeight: isShowSection ? '2000px' : 0,
                opacity: isShowSection ? 1 : 0,
                marginTop: isShowSection ? '1rem' : 0,
                transition: 'all 0.3s ease',
                overflow: 'hidden',
              }}
            >
              {CustomSectionContent({ week: selectedWeek })}
            </Text>
          </Fragment>
        )
      })}

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          {t`📄 Terms & Conditions`}
        </Flex>

        <ButtonIcon onClick={() => setIsShowTc(prev => !prev)}>
          {!isShowTc ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </Flex>

      <Text
        color={theme.subText}
        lineHeight="28px"
        paddingLeft="14px"
        sx={{
          maxHeight: isShowTc ? '2000px' : 0,
          opacity: isShowTc ? 1 : 0,
          marginTop: isShowTc ? '1rem' : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <li>
          <Trans>
            These Terms and Conditions{' '}
            <ExternalLink href="https://kyberswap.com/files/Kyber%20-%20Terms%20of%20Use%20-%2020%20November%202023.pdf">
              ({'"Terms"'})
            </ExternalLink>{' '}
            should be read in conjunction with the KyberSwap Terms of Use, which lay out the terms and conditions that
            apply to all KyberSwap promotional activities ({'"Campaign"'}).
          </Trans>
        </li>
        {TermsSection({ week: selectedWeek })}
      </Text>

      <Divider style={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="20px">
        <Flex fontSize={20} sx={{ gap: '4px' }} alignItems="center">
          {t`❓ FAQ`}
        </Flex>

        <ButtonIcon onClick={() => setIsShowFaq(prev => !prev)}>
          {!isShowFaq ? <Plus size={14} /> : <Minus size={14} />}
        </ButtonIcon>
      </Flex>

      <Box
        color={theme.subText}
        lineHeight="28px"
        paddingLeft="14px"
        maxWidth={upTo400 ? '300px' : upTo450 ? '350px' : undefined}
        sx={{
          maxHeight: isShowFaq ? '5000px' : 0,
          opacity: isShowFaq ? 1 : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {FaqSection({ week: selectedWeek })}
      </Box>
    </Box>
  )
}
