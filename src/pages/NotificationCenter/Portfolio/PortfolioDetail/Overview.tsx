import { Trans, t } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import PortfolioItem1 from 'assets/images/portfolio/portfolio1.png'
import PortfolioItem2 from 'assets/images/portfolio/portfolio2.png'
import PortfolioItem3 from 'assets/images/portfolio/portfolio3.png'
import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import DownloadWalletModal from 'components/DownloadWalletModal'
import Row from 'components/Row'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useOpenModal } from 'state/application/hooks'

const Title = styled.div`
  font-size: 48px;
  font-weight: 600;
`

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.background};
  width: 410px;
  height: 350px;
  padding: 40px 20px;
`
const CardItem = ({ title, icon, desc }: { title: string; icon: string; desc: string }) => {
  const theme = useTheme()

  return (
    <Card>
      <Column alignItems={'center'} gap="12px">
        <img src={icon} height={'100px'} />
        <Text color={theme.text} fontSize={'20px'} fontWeight={'500'}>
          {title}
        </Text>
      </Column>
      <Text color={theme.subText} lineHeight={'24px'}>
        {desc}
      </Text>
    </Card>
  )
}

export default function Overview() {
  const theme = useTheme()
  const openDownloadWalletModal = useOpenModal(ApplicationModal.DOWNLOAD_WALLET)
  return (
    <Column alignItems={'center'} gap="60px">
      <Column gap="24px" alignItems={'center'}>
        <Title>
          <Trans>
            Connect and create a{' '}
            <Text as="span" color={theme.primary}>
              Portfolio
            </Text>
          </Trans>
        </Title>
        <Text color={theme.subText} fontWeight={'500'}>
          The one-stop solution for all your cryptocurrency portfolio management needs.
        </Text>
        <ButtonPrimary width={'120px'} height={'36px'} onClick={openDownloadWalletModal}>
          <Trans>Connect</Trans>
        </ButtonPrimary>
      </Column>
      <Row justify={'center'} gap="24px">
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
          title={t`Widespread Support`}
          desc={t`Manage all your assets on a single platform with support for multiple cryptocurrencies, protocols, and centralized exchange, eliminating the need for multiple wallets and exchanges.`}
        />
      </Row>
      <DownloadWalletModal />
    </Column>
  )
}
