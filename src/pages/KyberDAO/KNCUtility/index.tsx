import { Trans } from '@lingui/macro'
import { formatUnits } from 'ethers/lib/utils'
import { NavLink } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import ringwaveGif from 'assets/gif/ringwave.gif'
import bgimg from 'assets/images/about_background.png'
import champion from 'assets/images/champion.png'
import gasrefund from 'assets/images/gasrefund.png'
import kncDropping from 'assets/images/knc_dropping.png'
import ringwave from 'assets/images/ringwave.png'
import crystals from 'assets/svg/crystals.svg'
import Column from 'components/Column'
import { APP_PATHS } from 'constants/index'
import { useStakingInfo } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

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
    padding: 24px;
  `}
`

const Container = styled.div`
  max-width: fit-content;
`

const Row = styled.div<{ reversed?: boolean }>`
  width: 100%;
  margin: auto;
  display: flex;
  justify-content: space-between;
  gap: 48px;
  padding: 24px 0;

  ${({ theme, reversed }) => theme.mediaWidth.upToMedium`
    width: 100%;
    flex-direction: ${reversed ? 'column-reverse' : 'column'};
    align-items: center;
  `}
  align-items: flex-start;
  & > * {
    flex: 1 1 0px;
    max-width: 700px;
  }
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
`

export default function KNCUtility() {
  const theme = useTheme()
  const { stakedBalance } = useStakingInfo()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  return (
    <Wrapper>
      <Container>
        <Row reversed>
          <Column gap="48px">
            <Text fontSize={48} fontWeight={400} id="knc-utility">
              <Trans>KNC Utility</Trans>
            </Text>
            <Column gap="28px">
              <Flex sx={{ gap: '12px' }} flexDirection="column">
                <YourStakedKNC>
                  <Text fontSize={12} lineHeight="16px" color={theme.subText}>
                    <Trans>Your Staked KNC</Trans>
                  </Text>
                  <Text
                    fontSize={16}
                    lineHeight="20px"
                    color={theme.text}
                    display="flex"
                    alignItems="center"
                    style={{ gap: '8px' }}
                  >
                    <KNCLogo size={20} /> {formatUnits(stakedBalance)} KNC
                  </Text>
                </YourStakedKNC>
                <Flex alignSelf="flex-end">
                  <NavLink
                    to={APP_PATHS.KYBERDAO_STAKE}
                    style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 500 }}
                  >
                    Stake here ↗
                  </NavLink>
                </Flex>
              </Flex>

              <Trans>
                <Text as="span" fontSize={16} fontWeight={500} color={theme.subText}>
                  Introducing KNC Utility, the program exclusively launched for loyal KNC holders that offers multiple
                  benefits to help you save on gas fees, earn rewards, and much more.{' '}
                  <Text as="span" color={theme.text}>
                    Discover the power of KNC Utility today!
                  </Text>
                </Text>
              </Trans>
            </Column>
          </Column>
          <Flex flexDirection="column" alignItems="center">
            <img src={crystals} width="30%" />
            <img
              src={ringwaveGif}
              width="100%"
              style={{ marginTop: '-20px', maxWidth: '533px' }}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null // prevents looping
                currentTarget.src = ringwave
              }}
            />
          </Flex>
        </Row>
        <Row>
          <Flex alignItems="center" justifyContent="center" width="100%" sx={{ position: 'relative' }}>
            <img
              src={gasrefund}
              style={{
                maxWidth: '700px',
                ...(upToMedium
                  ? {
                      width: '100%',
                    }
                  : {
                      width: '130%',
                      position: upToMedium ? 'unset' : 'absolute',
                      top: 0,
                      right: -50,
                    }),
              }}
            />
          </Flex>
          <Column gap="36px">
            <Text fontSize={36} fontWeight={400} id="gas-refund-program">
              <Trans>Gas Refund Program</Trans>
            </Text>
            <Column gap="56px">
              <GasRefundBox />
              <Text fontSize={16} fontWeight={400} lineHeight="24px" color={theme.subText}>
                <Trans>
                  KyberSwap’s Gas Refund Program is here to reward our users who stake in KyberDAO by offering gas fee
                  refunds in the form of KNC for their swap transactions on KyberSwap.{' '}
                  <NavLink to={APP_PATHS.KYBERDAO_STAKE}>Read More ↗</NavLink>
                  <br />
                  <br />
                  By staking KNC in KyberDAO, you can not only earn rewards but also save on transaction costs.
                  <br />
                  <br />
                  <Text fontSize={12} fontStyle="italic">
                    Note: Gas Refund is only available on Ethereum chain.
                  </Text>
                </Trans>
              </Text>
            </Column>
          </Column>
        </Row>
        <Row reversed>
          <Column gap="16px">
            <Text fontSize={20} fontWeight={400} lineHeight="32px" color={theme.text} id="how-to-participate">
              <Trans>How to participate</Trans>
            </Text>
            <Text fontSize={16} fontWeight={400} lineHeight="24px" color={theme.subText}>
              <Trans>
                To participate in KyberSwap&apos;s Gas Refund Program, you are required to stake in KyberDAO and meet
                the following requirements:
              </Trans>
            </Text>
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
            <Text fontSize={16} fontWeight={400} lineHeight="24px" color={theme.text}>
              <li>
                <Trans>
                  Swap transaction on Ethereum Chain with trading volume <b>≥$200</b> on KyberSwap.
                </Trans>
              </li>
            </Text>
            <Text fontSize={16} fontWeight={400} lineHeight="24px" color={theme.subText}>
              Once you have met these eligibility criteria, you will be eligible to receive gas fee refunds for your
              Swap transactions based on your staked KNC tier.{' '}
              <NavLink to={APP_PATHS.KYBERDAO_STAKE}>Read More ↗</NavLink>
            </Text>
          </Column>
          <Flex alignItems="center" justifyContent="center">
            <img src={champion} style={{ maxWidth: '483px', width: '100%' }} />
          </Flex>
        </Row>
        <Row>
          <Flex alignItems="center" justifyContent="center">
            <img src={kncDropping} style={{ maxWidth: '431px', width: '100%' }} />
          </Flex>
          <Column gap="36px">
            <Text fontSize={20} lineHeight="32px" fontWeight={400} id="faq">
              <Trans>FAQ</Trans>
            </Text>
            <Column gap="56px">
              <FAQ />
            </Column>
          </Column>
        </Row>
      </Container>
    </Wrapper>
  )
}
