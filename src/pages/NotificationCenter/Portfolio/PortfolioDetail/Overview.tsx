import { Trans, t } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import PortfolioItem1 from 'assets/images/portfolio/portfolio1.png'
import PortfolioItem2 from 'assets/images/portfolio/portfolio2.png'
import PortfolioItem3 from 'assets/images/portfolio/portfolio3.png'
import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'

const Title = styled.div`
  font-size: 48px;
  font-weight: 600;
  text-align: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 28px;
  `}
`

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.background};
  width: 410px;
  min-height: 350px;
  padding: 40px 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`
const CardItem = ({ title, icon, desc }: { title: string; icon: string; desc: string }) => {
  const theme = useTheme()

  return (
    <Card>
      <Column alignItems={'center'} gap="12px">
        <img src={icon} height={'100px'} />
        <Text color={theme.text} fontSize={'20px'} fontWeight={'500'} textAlign={'center'}>
          {title}
        </Text>
      </Column>
      <Text color={theme.subText} lineHeight={'24px'}>
        {desc}
      </Text>
    </Card>
  )
}

const CardWrapper = styled(Row)`
  justify-content: center;
  gap: 24px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`

const Wrapper = styled(Column)`
  gap: 60px;
  align-items: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 40px;
`}
`

export default function Overview() {
  const theme = useTheme()
  const connectWallet = useWalletModalToggle()
  const { account } = useActiveWeb3React()
  return (
    <Wrapper>
      <Column gap="24px" alignItems={'center'}>
        <Title>
          <Trans>
            Connect and create a{' '}
            <Text as="span" color={theme.primary}>
              Portfolio
            </Text>
          </Trans>
        </Title>
        <Text color={theme.subText} fontWeight={'500'} textAlign={'center'}>
          The one-stop solution for all your cryptocurrency portfolio management needs.
        </Text>
        {!account && (
          <ButtonPrimary width={'120px'} height={'36px'} onClick={connectWallet}>
            <Trans>Connect</Trans>
          </ButtonPrimary>
        )}
      </Column>
      <CardWrapper>
        <CardItem
          icon={PortfolioItem1}
          title={t`Easy Portfolio Management`}
          desc={t`KyberSwap Portfolio simplifies cryptocurrency portfolio management by providing an intuitive interface to track your investments, view real-time portfolio value, and monitor asset performance.`}
        />
        <CardItem
          icon={PortfolioItem2}
          title={t`Comprehensive Tracking`}
          desc={t`Gain insights on portfolio performance, analyze trends, and identify opportunities with robust analytics for informed investment decisions.`}
        />
        <CardItem
          icon={PortfolioItem3}
          title={t`Navigate Market Risks`}
          desc={t`Leverage advanced liquidity profiling data to uncover your portfolio's real value and safeguard your capital against excessive market volatility.`}
        />
      </CardWrapper>
    </Wrapper>
  )
}
