import { Trans } from '@lingui/macro'
import { formatUnits } from 'ethers/lib/utils'
import { NavLink } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import ringwaveGif from 'assets/gif/ringwave.gif'
import bgimg from 'assets/images/about_background.png'
import gasrefund from 'assets/images/gasrefund.png'
import ringwave from 'assets/images/ringwave.png'
import crystals from 'assets/svg/crystals.svg'
import Column from 'components/Column'
import { RowBetween } from 'components/Row'
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
    padding: 16px;
  `}
`

const Container = styled.div`
  max-width: 1400px;
`

const Row = styled.div`
  width: 100%;
  margin: auto;
  display: flex;
  justify-content: space-between;
  gap: 8vw;
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
    max-width: 700px;
  }
`

// todo: will again, dont remove this
// const EndedTag = styled.div`
//   padding: 2px 12px;
//   width: fit-content;
//   border-radius: 12px;
//   background: ${({ theme }) => transparentize(0.8, theme.red)};
//   color: ${({ theme }) => theme.red};
//   font-size: 12px;
//   font-weight: 500;
// `

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
`

export default function KNCUtility() {
  const theme = useTheme()
  const { stakedBalance } = useStakingInfo()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const refundImg = (
    <Flex alignItems="center" justifyContent="center" width="100%" sx={{ position: 'relative' }}>
      <img
        src={gasrefund}
        style={{
          ...(upToMedium
            ? {
                maxHeight: '300px',
                maxWidth: '100%',
              }
            : {
                maxWidth: '700px',
                width: '100%',
              }),
        }}
      />
    </Flex>
  )
  return (
    <Wrapper>
      <Container>
        <Row>
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
                <Text as="span" fontSize={16} fontWeight={500} color={theme.subText} lineHeight="24px">
                  Stake your KNC (Kyber Network Crystal) tokens to vote on KIP proposals, plus enjoy multiple benefits
                  such as saving on gas fees, earning rewards, and more.
                </Text>
              </Trans>
            </Column>
          </Column>
          {upToMedium ? (
            refundImg
          ) : (
            <Flex flexDirection="column" alignItems="center">
              <img src={crystals} width="25%" />
              <img
                src={ringwaveGif}
                width="100%"
                style={{ marginTop: '-60px', maxWidth: '533px' }}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null // prevents looping
                  currentTarget.src = ringwave
                }}
              />
            </Flex>
          )}
        </Row>
        <Row style={{ paddingBottom: upToMedium ? '0' : undefined }}>
          <RowBetween flexDirection="row" gap="16px">
            <Text fontSize={upToMedium ? 20 : 36} fontWeight={400} id="gas-refund-program" alignSelf="start">
              <Trans>Gas Refund Program</Trans>
            </Text>
            {/* <EndedTag>
              <Text>
                <Trans>Ended</Trans>
              </Text>
            </EndedTag> */}
          </RowBetween>
          {upToMedium || <div />}
        </Row>
        <Row style={{ padding: upToMedium ? '16px 0 12px' : undefined }}>
          <Column gap="48px">
            <GasRefundBox />
            <Text fontSize={16} fontWeight={400} lineHeight="24px" color={theme.subText}>
              <Trans>
                By staking KNC, you are rewarded with tier-based gas refunds in the form of KNC whenever you make an
                eligible trade on KyberSwap. <b>Stake KNC and trade on KyberSwap today!</b>
                <br />
                <br />
                <Text fontSize={12} fontStyle="italic">
                  *Note: Gas Refund is currently only available on Ethereum.
                </Text>
              </Trans>
            </Text>
          </Column>
          <Column gap="16px">
            <Text fontSize={20} fontWeight={400} lineHeight="32px" color={theme.text} id="how-to-participate">
              <Trans>How to participate</Trans>
            </Text>
            <Text fontSize={16} fontWeight={400} lineHeight="24px" color={theme.subText}>
              <Trans>
                To participate in KyberSwap&apos;s Gas Refund Program, you must stake KNC and meet the necessary
                requirements. The amount of gas refunded will depend on your staking Tier.{' '}
                <NavLink to="/temp-link">Read More ↗</NavLink>
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
                <Trans>Value of each trade on KyberSwap has to be ≥ $200; calculated at the point of trade.</Trans>
              </li>
            </Text>
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
          {upToMedium || refundImg}
        </Row>
      </Container>
    </Wrapper>
  )
}
