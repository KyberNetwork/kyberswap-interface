import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Video from 'assets/videos/background.mp4'
import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import FAQ from 'components/FAQ'
import Row from 'components/Row'
import { TERM_FILES_PATH } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import Banners from 'pages/AirdropCampaign/Banners'
import DetailCampaign from 'pages/AirdropCampaign/DetailCaimpaign'
import EligibleSection from 'pages/AirdropCampaign/EligibleSection'
import KNCPriceLogo from 'pages/AirdropCampaign/KncPriceLogo'
import { useWalletModalToggle } from 'state/application/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

import { AboutPage, Wrapper } from './styleds'

const questions = [
  {
    title: t`Who can be eligible for the 6th-anniversary KyberSwap Airdrop?`,
    content: t`Eligibility for KyberSwap airdrops may vary from one campaign to another. Typically, participants need to meet specific requirements set by KyberSwap, such as holding a minimum amount of KNC tokens or completing certain tasks(LPs, Swap, Limit Order, KyberAI). Eligibility details for each airdrop campaign are usually provided in the campaign's terms and conditions.`,
  },
  {
    title: t`Any Airdrop campaign after the 6th-anniversary KyberSwap Airdrop?`,
    content: t`The KyberSwap team is planning various programs for Monthly quality users and highly active users, including loyal KyberSwap users, after the 6th-anniversary KyberSwap Airdrop.`,
  },
  {
    title: t`What about Monthly quality users and loyal KyberSwap users?`,
    content: t`Eligibility depends on calculations by KyberSwap and may change. If you're an active user who frequently uses KyberSwap, you can be eligible for the next Airdrop.`,
  },
  {
    title: t`What KyberSwap Airdrop campaigns are available?`,
    content: t`KyberSwap periodically conducts airdrop campaigns to promote its platform and incentivize user engagement. These campaigns can vary in terms of the tasks or conditions required to participate. To stay updated on available airdrop campaigns, you can visit the official KyberSwap website, follow their social media channels, or subscribe to their newsletters.`,
  },
  {
    title: t`How do I participate in KyberSwap airdrop campaigns in the future?`,
    content: t`To join, follow KyberSwap's specific instructions for each campaign, which might include on-chain or off-chain tasks, being an active user, or enjoying new features. Regularly check their official channels and website for updates.`,
  },
  {
    title: t`Are KyberSwap Airdrops free, or do I need to pay for participation?`,
    content: t`KyberSwap Airdrops are typically free, meaning you don't need to pay to participate. However, you may need to meet certain eligibility criteria or complete specific tasks to qualify for an airdrop.`,
  },
  {
    title: t`How can I check if I've received the tokens from a KyberSwap Airdrop?`,
    content: t`Check our Airdrop page and conditions to receive the Airdrop. If a condition has a green check mark, you will receive the Airdrop.`,
  },
]
export enum AirdropTabs {
  ACTIVE,
  ENDED,
}

const Tab = styled(Text)<{ active: boolean }>`
  font-size: 24px;
  font-weight: 500;
  cursor: pointer;
  color: ${({ active, theme }) => (active ? theme.primary : theme.subText)};
`

function AirdropCampaign() {
  const { account } = useActiveWeb3React()
  const [tab, setTab] = useState(AirdropTabs.ACTIVE)
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const connectWallet = useWalletModalToggle()

  return (
    <AboutPage>
      <video
        playsInline
        autoPlay
        muted
        loop
        style={{
          inset: 0,
          zIndex: -1,
          position: 'absolute',
          height: '100vh',
          objectFit: 'cover',
          opacity: 0.5,
          width: '100%',
        }}
      >
        <source src={Video} type="video/webm"></source>
      </video>
      <Wrapper>
        <Flex
          sx={{ gap: '24px' }}
          alignItems="center"
          justifyContent={'space-between'}
          flexDirection={upToSmall ? 'column' : 'row'}
        >
          <Column alignItems="flex-start" gap="16px">
            <Text as="h1" fontSize={'20px'} fontWeight="500">
              <Trans>Airdrop Campaign</Trans>
            </Text>
            <Text as="h1" fontSize={['28px', '48px']} lineHeight={['32px', '56px']} fontWeight="600">
              <Trans>
                KyberSwap Airdrop
                <br />
                Campaign
              </Trans>
            </Text>
            <Text fontSize={'16px'} color={theme.subText} fontWeight="400">
              <Trans>Sky&apos;s the Limit: Join the Airdrop Adventure!</Trans>
            </Text>
            {!account && (
              <ButtonPrimary onClick={connectWallet} width={'94px'} height={'36px'}>
                <Trans>Connect</Trans>
              </ButtonPrimary>
            )}
          </Column>
          <KNCPriceLogo />
        </Flex>

        <Row justify="center">
          <Banners />
        </Row>

        <Column gap="24px">
          <Row gap="12px" justify={upToSmall ? 'center' : undefined}>
            <Tab active={tab === AirdropTabs.ACTIVE} onClick={() => setTab(AirdropTabs.ACTIVE)}>
              <Trans>Active</Trans>
            </Tab>
            <div style={{ width: '1px', height: 18, border: `1px solid ${theme.border}` }} />
            <Tab active={tab === AirdropTabs.ENDED} onClick={() => setTab(AirdropTabs.ENDED)}>
              <Trans>Ended</Trans>
            </Tab>
          </Row>

          <Row gap="24px" flexDirection={upToSmall ? 'column' : 'row'} align={'flex-start'}>
            {tab === AirdropTabs.ENDED ? (
              <Row justify="center" height={'100px'}>
                <Text fontSize={'14px'} color={theme.subText}>
                  No campaign found
                </Text>
              </Row>
            ) : (
              <>
                <DetailCampaign />
                <EligibleSection />
              </>
            )}
          </Row>
        </Column>

        <Column gap="16px" width="100%">
          <Text as="h2" fontWeight="500" fontSize={['28px', '28px']}>
            <Trans>FAQ</Trans>
          </Text>
          <FAQ questions={questions} style={{ background: 'transparent', border: `1px solid ${theme.border}` }} />
        </Column>

        <Column gap="16px" width="100%">
          <Text as="h2" fontWeight="500" fontSize={['28px', '28px']}>
            <Trans>Terms and Conditions</Trans>
          </Text>
          <Column gap="56px">
            <ul style={{ paddingInlineStart: '20px', marginBlockStart: 0 }}>
              <li>
                <Text fontSize={14} fontWeight={400} lineHeight="20px">
                  <Trans>
                    These{' '}
                    <ExternalLink href="https://static.qiibee.com/qiibee-Airdrop-Terms.pdf">
                      Terms and Conditions
                    </ExternalLink>{' '}
                    should be read in conjunction with the KyberSwap{' '}
                    <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS}>Terms of Use</ExternalLink>, which lay out the
                    terms and conditions that apply to all KyberSwap promotional activities <b>(Campaign)</b>.
                  </Trans>
                </Text>
              </li>
              <br />
              <li>
                <Text fontSize={14} fontWeight={400} lineHeight="20px">
                  <Trans>
                    Participants who perform one or more relevant actions through one of the company’s campaigns shall
                    receive KNC Tokens <b>the Tokens</b>. The Participant shall receive the Tokens after a relevant
                    action is deemed valid by the Company.
                  </Trans>
                </Text>
              </li>
              <br />
              <li>
                <Text fontSize={14} fontWeight={400} lineHeight="20px">
                  <Trans>
                    For this pilot gas refund program, KyberSwap retains the right to cancel or amend the program&apos;s
                    end date upon giving reasonable notice.
                  </Trans>
                </Text>
              </li>
              <br />
              <li>
                <Text fontSize={14} fontWeight={400} lineHeight="20px">
                  <Trans>
                    <b>Eligibility</b>: To be eligible for the airdrop, you must:
                    <ul>
                      <li>
                        Have a valid <b>wallet address</b>
                      </li>
                      <li>Have completed the required tasks (Swap/ Add Liquidity, Limit Order and KyberAI)</li>
                      <li>Not be a resident of a country that is subject to sanctions</li>
                    </ul>
                  </Trans>
                </Text>
              </li>
              <br />
              <li>
                <Text fontSize={14} fontWeight={400} lineHeight="20px">
                  <Trans>
                    Any and all decisions made by KyberSwap in relation to every aspect of the program shall be final
                    and conclusive.
                  </Trans>
                </Text>
              </li>
            </ul>
          </Column>
        </Column>
      </Wrapper>
    </AboutPage>
  )
}

export default AirdropCampaign
