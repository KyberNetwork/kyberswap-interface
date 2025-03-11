import { Trans } from '@lingui/macro'
import { formatUnits } from 'ethers/lib/utils'
import { transparentize } from 'polished'
import { NavLink } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetGasRefundProgramInfoQuery } from 'services/kyberDAO'
import styled from 'styled-components'

import bgimg from 'assets/images/about_background.png'
import kyberDao1 from 'assets/images/gas-refund/kyberdao-1.png'
import kyberDao2 from 'assets/images/gas-refund/kyberdao-2.png'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import { RowBetween } from 'components/Row'
import { APP_PATHS, TERM_FILES_PATH } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useStakingInfo } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

import KNCLogo from '../kncLogo'
import FAQ from './FAQ'
import GasRefundBox from './GasRefundBox'
import { HeaderCell, Table, TableHeader, TableRow } from './Table'

const Wrapper = styled.div`
  width: 100%;
  background-image: url(${bgimg});
  background-size: 100% auto;
  background-repeat: repeat-y;
  z-index: 1;
  background-color: transparent;
  background-position: top;
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 24px 48px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px;
  `}
`

const Container = styled.div`
  max-width: 1224px;
`

const Row = styled.div`
  width: 100%;
  margin: auto;
  display: flex;
  justify-content: space-between;
  gap: 48px;
  padding: 24px 0;
  align-items: flex-start;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    flex-direction: column;
    align-items: center;
    gap: 48px;
  `}

  & > * {
    flex: 1 1 0px;
    max-width: 588px;
    ${({ theme }) => theme.mediaWidth.upToMedium`
      max-width: 700px;
    `}
    width: 100%;
  }
`

const Li = styled.li`
  ::marker {
    color: ${({ theme }) => theme.subText};
  }
`

const EndedTag = styled.div`
  padding: 2px 12px;
  width: fit-content;
  border-radius: 12px;
  background: ${({ theme }) => transparentize(0.8, theme.red)};
  color: ${({ theme }) => theme.red};
  font-size: 12px;
  font-weight: 500;
`

const FormWrapper = styled.div`
  background-color: ${({ theme }) => theme.background};
  border-radius: 20px;
  padding: 16px;
  width: 100%;
`

const YourStakedKNC = styled(FormWrapper)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.primary};
`

export default function KNCUtility() {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const { stakedBalance } = useStakingInfo()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { data: gasRefundProgramInfo } = useGetGasRefundProgramInfoQuery()
  const isEnded = gasRefundProgramInfo?.data.status === 'finished'

  return (
    <Wrapper>
      <Container>
        <Row>
          <Column gap="24px">
            <Text fontSize={24} fontWeight={500} id="knc-utility">
              <Trans>KNC Utility</Trans>
            </Text>
            <Column gap="16px">
              <YourStakedKNC>
                <Text fontSize={14} lineHeight="20px" color={theme.subText}>
                  <Trans>Your Staked KNC</Trans>
                </Text>
                <Text
                  fontSize={16}
                  lineHeight="20px"
                  color={theme.text}
                  display="flex"
                  alignItems="center"
                  style={{ gap: '8px' }}
                  fontWeight={500}
                >
                  <KNCLogo size={20} /> {account ? formatUnits(stakedBalance) : '--'} KNC
                </Text>
              </YourStakedKNC>
              <Flex alignSelf="flex-end">
                <NavLink to={APP_PATHS.KYBERDAO_STAKE}>
                  <ButtonLight padding="2px 12px">
                    <Text fontSize={12} lineHeight="16px" fontWeight={500}>
                      <Trans>Stake here ↗</Trans>
                    </Text>
                  </ButtonLight>
                </NavLink>
              </Flex>

              <Text as="span" fontSize={16} fontWeight={500} color={theme.subText} lineHeight="24px">
                <Trans>
                  Stake your KNC (<NavLink to={`${APP_PATHS.ABOUT}/knc`}>Kyber Network Crystal</NavLink>) tokens to{' '}
                  <NavLink to={APP_PATHS.KYBERDAO_VOTE}>vote on KIPs</NavLink> and shape the future of the KyberSwap
                  ecosystem. KNC stakers also enjoy multiple benefits such as savings on gas fees, protocol fee rewards,
                  and more.
                </Trans>
              </Text>
            </Column>
          </Column>
          <Flex flexDirection="column" alignItems="center">
            <img src={kyberDao1} width="100%" style={{ maxHeight: '372px' }} />
          </Flex>
        </Row>
        <Row style={{ paddingBottom: upToMedium ? '0' : undefined }}>
          <RowBetween flexDirection="row" gap="16px">
            <Text fontSize={upToMedium ? 20 : 24} fontWeight={500} id="gas-refund-program" alignSelf="start">
              <Trans>Gas Refund Program</Trans>
            </Text>
            {isEnded && (
              <EndedTag>
                <Text>
                  <Trans>Ended</Trans>
                </Text>
              </EndedTag>
            )}
          </RowBetween>
          {upToMedium || <div />}
        </Row>
        <Row style={{ padding: upToMedium ? '16px 0 12px' : undefined }}>
          <Column>
            <GasRefundBox />
            <img src={kyberDao2} alt="Kyber DAO" width="100%" style={{ maxHeight: '491px', marginTop: '-30px' }} />
          </Column>
          <Column gap="16px">
            <Text fontSize={20} fontWeight={400} lineHeight="32px" color={theme.text} id="how-to-participate">
              <Trans>How to participate</Trans>
            </Text>
            <Text fontSize={16} fontWeight={400} lineHeight="24px" color={theme.subText}>
              <Trans>
                To participate in KyberSwap&apos;s Gas Refund Program, you must first stake KNC and then meet the
                necessary trading requirements:
              </Trans>
            </Text>
            <Text fontSize={16} fontWeight={400} lineHeight="24px" color={theme.text} fontStyle="italic">
              <Trans>
                Step 1 - Stake KNC on KyberDAO
                <br />
                Step 2 - Trade on KyberSwap
              </Trans>
            </Text>
            <ul
              style={{
                listStylePosition: 'outside',
                paddingInlineStart: '30px',
                display: 'flex',
                gap: '16px',
                flexDirection: 'column',
                margin: 0,
              }}
            >
              <Li>
                <Text fontSize={16} fontWeight={400} lineHeight="24px" color={theme.subText} as="span">
                  <Trans>
                    Value of each trade (calculated at the point of the trade) on KyberSwap has to be ≥ $200.
                  </Trans>
                </Text>
              </Li>
              <Li>
                <Text fontSize={16} fontWeight={400} lineHeight="24px" color={theme.subText} as="span">
                  <Trans>Trades only on Ethereum chain are applicable.</Trans>
                </Text>
              </Li>
              <Li>
                <Text fontSize={16} fontWeight={400} lineHeight="24px" color={theme.subText} as="span">
                  <Trans>
                    The amount of the gas refunded will depend on your tier displayed below. Read more{' '}
                    <ExternalLink href="https://docs.kyberswap.com/governance/knc-token/gas-refund-program">
                      here ↗
                    </ExternalLink>
                  </Trans>
                </Text>
              </Li>
            </ul>
            <Table>
              <TableHeader>
                <HeaderCell>
                  <Trans>Tier</Trans>
                </HeaderCell>
                <HeaderCell textAlign="center">
                  <Trans>KNC Staked</Trans>
                </HeaderCell>
                <HeaderCell textAlign="center">
                  <Trans>Gas Refund</Trans>
                </HeaderCell>
              </TableHeader>
              <TableRow>
                <HeaderCell>Tier 1</HeaderCell>
                <HeaderCell textAlign="center">500 KNC</HeaderCell>
                <HeaderCell textAlign="center">10%</HeaderCell>
              </TableRow>
              <TableRow>
                <HeaderCell>Tier 2</HeaderCell>
                <HeaderCell textAlign="center">5,000 KNC</HeaderCell>
                <HeaderCell textAlign="center">15%</HeaderCell>
              </TableRow>
              <TableRow>
                <HeaderCell>Tier 3</HeaderCell>
                <HeaderCell textAlign="center">10,000 KNC</HeaderCell>
                <HeaderCell textAlign="center">20%</HeaderCell>
              </TableRow>
            </Table>
          </Column>
        </Row>
        <Row>
          <Column gap="16px" width="100%">
            <Text fontSize={20} lineHeight="32px" fontWeight={400} id="faq">
              <Trans>FAQ</Trans>
            </Text>
            <Column gap="56px">
              <FAQ />
            </Column>
          </Column>
          <Column gap="16px" width="100%">
            <Text fontSize={20} lineHeight="32px" fontWeight={400} id="tac">
              <Trans>Terms and Conditions</Trans>
            </Text>
            <Column gap="56px">
              <ul style={{ paddingInlineStart: '20px', marginBlockStart: 0 }}>
                <li>
                  <Text fontSize={14} fontWeight={400} lineHeight="20px">
                    <Trans>
                      These Terms and Conditions should be read in conjunction with the KyberSwap{' '}
                      <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS}>Terms of Use</ExternalLink>, which lay out
                      the terms and conditions that apply to all KyberSwap activities.
                    </Trans>
                  </Text>
                </li>
                <br />
                <li>
                  <Text fontSize={14} fontWeight={400} lineHeight="20px">
                    <Trans>
                      By visiting KyberSwap and participating in the program, the User is deemed to have read,
                      understood, and agreed to these Terms and Conditions and the KyberSwap{' '}
                      <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS}>Terms of Use</ExternalLink>.
                    </Trans>
                  </Text>
                </li>
                <br />
                <li>
                  <Text fontSize={14} fontWeight={400} lineHeight="20px">
                    <Trans>
                      For this pilot gas refund program, KyberSwap retains the right to cancel or amend the
                      program&apos;s end date upon giving reasonable notice.
                    </Trans>
                  </Text>
                </li>
                <br />
                <li>
                  <Text fontSize={14} fontWeight={400} lineHeight="20px">
                    <Trans>
                      KyberSwap maintains the right, at its sole discretion, to take action or remove rewards against
                      the User who violates the KyberSwap{' '}
                      <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS}>Terms of Use</ExternalLink> and/or violates,
                      cheats, or exploits the program, including but not limited to, any suspicious activities, or any
                      attempts to circumvent these Terms and Conditions.
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
        </Row>
      </Container>
    </Wrapper>
  )
}
