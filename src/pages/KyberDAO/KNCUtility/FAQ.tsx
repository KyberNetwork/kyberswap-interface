import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { TERM_FILES_PATH } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const Title = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
`

enum Panel {
  Q1,
  Q2,
  Q3,
  Q4,
  Q5,
}

type PanelProps = {
  isExpanded: boolean
  toggleExpand: () => void
  title: string
  content: ReactNode
}

const DetailPanel: React.FC<PanelProps> = ({ isExpanded, title, content, toggleExpand }) => {
  const theme = useTheme()

  return (
    <>
      <Flex
        role="button"
        onClick={() => {
          toggleExpand()
        }}
        sx={{
          height: '56px',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <Title>{title}</Title>

        <Flex
          role="button"
          onClick={toggleExpand}
          sx={{
            width: '20px',
            height: '20px',
            cursor: 'pointer',
            transition: 'all 150ms linear',
            transform: isExpanded ? 'rotate(180deg)' : undefined,
          }}
        >
          <ChevronDown size="20" color={theme.text} />
        </Flex>
      </Flex>

      {isExpanded && (
        <Text fontSize={14} marginBottom="16px" lineHeight="20px" color={theme.text}>
          {content}
        </Text>
      )}
    </>
  )
}

const DetailsContainer = styled.div`
  padding: 16px 24px;
  width: 600px;
  height: fit-content;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100%;
  `}

  display: flex;
  flex-direction: column;
  background: ${({ theme }) => rgba(theme.background, 0.8)};
  border-radius: 20px;
`

const Separator = styled.div`
  width: 100%;
  height: 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  margin: 8px 0;
`

const FAQ: React.FC = () => {
  const [expandedPanel, setExpandedPanel] = useState<Panel | undefined>()

  const handleToggleExpand = (panel?: Panel) => {
    if (expandedPanel === panel) {
      setExpandedPanel(undefined)
    } else {
      setExpandedPanel(panel)
    }
  }

  return (
    <DetailsContainer>
      <DetailPanel
        toggleExpand={() => {
          handleToggleExpand(Panel.Q1)
        }}
        isExpanded={expandedPanel === Panel.Q1}
        title={t`Can I participate in the Gas Refund Program if I am not staking in KyberDAO?`}
        content={
          <Trans>
            No, only participants who are staking KNC in KyberDAO with a minimum of 500 KNC and meet the eligibility
            criteria by completing a minimum trading volume of <b>≥$200</b> and with least 1 swap on KyberSwap.
          </Trans>
        }
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => {
          handleToggleExpand(Panel.Q2)
        }}
        isExpanded={expandedPanel === Panel.Q2}
        title={t`How are rewards calculated?`}
        content={t`Gas refund rewards is based accordingly on the user's staked KNC and tier, and will be converted to KNC at the time of the transaction gas cost.`}
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => {
          handleToggleExpand(Panel.Q3)
        }}
        isExpanded={expandedPanel === Panel.Q3}
        title={t`When will rewards be available to claim?`}
        content={
          <Trans>
            There is a countdown timer for rewards for available rewards to claim. Rewards will only be available at the
            start of n+2 epoch.
            <br />
            <br />
            You can claim your rewards in the KNC Utility page or in the Wallet UI.
          </Trans>
        }
        // content={t`You can claim your rewards in the KNC Utility page or in the Wallet UI.`}
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => {
          handleToggleExpand(Panel.Q4)
        }}
        isExpanded={expandedPanel === Panel.Q4}
        title={t`Terms and Conditions`}
        content={
          <>
            <li>
              <Trans>
                These Terms and Conditions (&quot;
                <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS}>Terms</ExternalLink>&quot;) should be read in
                conjunction with the KyberSwap Terms of Use, which lay out the terms and conditions that apply to all
                KyberSwap activities.
              </Trans>
            </li>
            <br />
            <li>
              <Trans>
                Kyberswap is set to launch a pilot gas refund program, and retains the right to amend the program&apos;s
                end date with reasonable notice.
              </Trans>
            </li>
            <br />
            <li>
              <Trans>
                KyberSwap maintains the right, at its sole discretion, to remove rewards for any user who{' '}
                <i>violates, cheats, or exploits the program</i>.
              </Trans>
            </li>
          </>
        }
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => {
          handleToggleExpand(Panel.Q5)
        }}
        isExpanded={expandedPanel === Panel.Q5}
        title={t`Other Details`}
        content={
          <>
            <li>
              <Trans>
                By visiting Kyberswap and participating in the program, You are deemed to have read, understood, and
                agreed to the Terms stated here in.
              </Trans>
            </li>
            <br />
            <li>
              <Trans>
                Kyberswap shall be entitled to take any form of action against the User who violates the Kyberswap Terms
                of Use and/or abuses the program, including but not limited to, any suspicious activities, or any
                attempts to circumvent these Terms.
              </Trans>
            </li>
            <br />
            <li>
              <Trans>
                Any and all decisions made by Kyberswap in relation to every aspect of the Campaign shall be final and
                conclusive. Any subsequent correspondences, protests, appeals, or inquiries will not be entertained.
              </Trans>
            </li>
            <br />
            <li>
              <Trans>
                Kyberswap reserves the right to cancel, terminate or suspend the Campaign upon giving adequate notice.
              </Trans>
            </li>
            <br />
            <li>
              <Trans>
                Kyberswap reserves the right to amend, waive, suspend, terminate or interpret any portion of these Terms
                in its sole discretion, and at any time without prior notice. In such an event, Kyberswap will make
                reasonable efforts to notify you.
              </Trans>
            </li>
          </>
        }
      />
    </DetailsContainer>
  )
}

export default FAQ
