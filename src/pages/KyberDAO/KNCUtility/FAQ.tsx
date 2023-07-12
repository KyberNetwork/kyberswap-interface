import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { NavLink } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { APP_PATHS, TERM_FILES_PATH } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const Title = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
  max-width: calc(100% - 20px - 8px);
`

enum Panel {
  Q_Join,
  Q_Chain,
  Q_When,
  Q_Deadline,
  Q_Vote,
  Q_Limit,
  Q_Term,
  Q_Other,
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
  height: fit-content;
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
        toggleExpand={() => handleToggleExpand(Panel.Q_Join)}
        isExpanded={expandedPanel === Panel.Q_Join}
        title={t`Can I participate in the Gas Refund Program if I am not staking in KyberDAO?`}
        content={
          <Trans>
            No. You have to stake a minimum of 500 KNC in KyberDAO (on Ethereum) here, and meet the eligibility criteria
            by completing swap(s) on KyberSwap, with a minimum trading volume of ≥$200 per swap.
          </Trans>
        }
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => handleToggleExpand(Panel.Q_Chain)}
        isExpanded={expandedPanel === Panel.Q_Chain}
        title={t`Are swaps on all chains eligible for gas refunds?`}
        content={
          <Trans>
            During this beta phase, only swaps on Ethereum are eligible for gas refunds. We may expand the gas refund
            program to other chains in the future.
          </Trans>
        }
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => handleToggleExpand(Panel.Q_When)}
        isExpanded={expandedPanel === Panel.Q_When}
        title={t`When will rewards be available to claim?`}
        content={
          <Trans>
            On the “Pending” tab, there is a countdown timer showing when pending refunds become available for claiming.
            Refunds become available for claiming at the start of n+2 epoch. Each epoch lasts approximately 2 weeks. You
            can claim your rewards in the KNC Utility page or in the Wallet widget.
          </Trans>
        }
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => handleToggleExpand(Panel.Q_Deadline)}
        isExpanded={expandedPanel === Panel.Q_Deadline}
        title={t`Is there a deadline to claim your gas refunds?`}
        content={
          <Trans>
            There is no deadline to claim your gas refunds. You can wait for more KNC to be accumulated before claiming
            them in order to save on gas fees.
          </Trans>
        }
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => handleToggleExpand(Panel.Q_LimitOrder)}
        isExpanded={expandedPanel === Panel.Q_LimitOrder}
        title={t`Are limit orders and cross-chain swaps eligible for gas refunds?`}
        content={
          <Trans>
            No. Limit orders and cross-chain swaps are not eligible for gas refunds. Only standard swaps on KyberSwap
            are eligible.
          </Trans>
        }
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => handleToggleExpand(Panel.Q_Vote)}
        isExpanded={expandedPanel === Panel.Q_Vote}
        title={t`How can I vote on KIPs with my staked KNC to earn voting rewards?`}
        content={
          <Trans>
            Once you have staked KNC, you can vote on active KyberDAO KIPs (Kyber Improvement Proposals) on the{' '}
            <NavLink to={APP_PATHS.KYBERDAO_VOTE}>Vote page</NavLink> to earn voting rewards. Users who stake KNC can
            enjoy gas refunds + vote on KIPs to and earn even more rewards. For more information on how to vote, please
            visit{' '}
            <ExternalLink href="https://docs.kyberswap.com/governance/kyberdao">
              https://docs.kyberswap.com/governance/kyberdao
            </ExternalLink>
            .
          </Trans>
        }
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => handleToggleExpand(Panel.Q_Limit)}
        isExpanded={expandedPanel === Panel.Q_Limit}
        title={t`What is the maximum gas refund limit for a user?`}
        content={
          <Trans>Each user wallet address is eligible for gas refund of up to $200 within two epoch cycles.</Trans>
        }
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => handleToggleExpand(Panel.Q_Term)}
        isExpanded={expandedPanel === Panel.Q_Term}
        title={t`Terms and Conditions`}
        content={
          <>
            <li>
              <Trans>
                These Terms and Conditions (<ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS}>Terms</ExternalLink>)
                should be read in conjunction with the KyberSwap Terms of Use, which lay out the terms and conditions
                that apply to all KyberSwap activities.
              </Trans>
            </li>
            <br />
            <li>
              <Trans>
                Currently, only trades on Ethereum are eligible for gas refunds. Gas refunds amount is based on the
                users’ KNC staking tier and the value of each trade.
              </Trans>
            </li>
            <br />
            <li>
              <Trans>
                For a trade to be eligible for gas refunds (after staking KNC), the trade value has to be ≥$200;
                calculated by KyberSwap at the point of trade.
              </Trans>
            </li>
            <br />
            <li>
              <Trans>Each address has a maximum limit of $200 in gas refunds per month.</Trans>
            </li>
            <br />
            <li>
              <Trans>
                KyberSwap retains the right to amend the gas refund program&apos;s end date with reasonable notice.
              </Trans>
            </li>
            <br />
            <li>
              <Trans>
                KyberSwap maintains the right, at its sole discretion, to remove rewards for any user who violates,
                cheats, or exploits the program.
              </Trans>
            </li>
          </>
        }
      />
    </DetailsContainer>
  )
}

export default FAQ
