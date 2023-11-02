import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Wallet from 'components/Icons/Wallet'
import { TokenLogoWithChain } from 'components/Logo'
import Row, { RowFit } from 'components/Row'
import Table, { TableColumn } from 'components/Table'
import useTheme from 'hooks/useTheme'
import { LiquidityScore } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/TokenAllocation'
import { Section } from 'pages/TrueSightV2/components'
import { ExternalLink } from 'theme'
import getShortenAddress from 'utils/getShortenAddress'

const WalletLabel = styled.div`
  display: flex;
  gap: 2px;
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 16px;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 4px;
`

const TokenCell = () => {
  return (
    <Row gap="14px">
      <TokenLogoWithChain
        chainId={1}
        size={'36px'}
        tokenLogo="https://storage.googleapis.com/ks-setting-1d682dca/061620bb-15ab-4877-ae14-ea615e07a5291697781498049.png"
      />
      <Column gap="4px">
        <Text fontWeight={'500'}>KNC</Text>
        <WalletLabel>
          <Wallet size={12} />
          <Text>{getShortenAddress('0x53beBc978F5AfC70aC3bFfaD7bbD88A351123723')}</Text>
        </WalletLabel>
      </Column>
    </Row>
  )
}

const ActionTitle = () => {
  const theme = useTheme()
  return (
    <Flex alignItems={'center'} sx={{ gap: '4px' }} justifyContent={'flex-end'}>
      Action <TransactionSettingsIcon fill={theme.subText} size={16} />
    </Flex>
  )
}

const ActionButton = () => {
  const theme = useTheme()
  return (
    <Row justify="flex-end" gap="8px">
      <ButtonAction
        style={{
          backgroundColor: rgba(theme.primary, 0.2),
          padding: '4px 6px',
          color: theme.primary,
          width: '24px',
          height: '24px',
        }}
      >
        <LiquidityIcon />
      </ButtonAction>
      <ButtonAction style={{ backgroundColor: rgba(theme.subText, 0.2), padding: '4px' }}>
        <Icon id="swap" size={16} color={theme.subText} />
      </ButtonAction>
    </Row>
  )
}

const columns: TableColumn[] = [
  { title: t`Token`, dataIndex: 'token', align: 'left', render: TokenCell },
  { title: t`Amount`, dataIndex: 'token' },
  { title: t`Price`, dataIndex: 'balance' },
  { title: t`Real Value`, dataIndex: 'token' },
  {
    title: t`Liquidity Score`,
    dataIndex: 'token',
    render: LiquidityScore,
    tooltip: (
      <Trans>
        Liquidity Score of a token refers to how easily that token can be bought or sold in the market without
        significantly impacting its price. Read more <ExternalLink href="/todo">here ↗</ExternalLink>
      </Trans>
    ),
  },
  {
    title: t`24H Volatility Score`,
    dataIndex: 'token',
    render: () => 'test',
    tooltip: (
      <Trans>
        Volatility score measures the price volatility of the token. Find out more about the score{' '}
        <ExternalLink href="/todo">here ↗</ExternalLink>
      </Trans>
    ),
  },
  {
    title: t`KyberScore`,
    dataIndex: 'token',
    render: () => 'test',
    tooltip: (
      <Trans>
        KyberScore uses AI to measure the upcoming trend of a token (bullish or bearish) by taking into account multiple
        on-chain and off-chain indicators. The score ranges from 0 to 100. The higher the score, the more bullish the
        token in the short-term. Read more <ExternalLink href="/todo">here ↗</ExternalLink>
      </Trans>
    ),
  },
  {
    title: <ActionTitle />,
    align: 'right',
    dataIndex: 'token',
    render: ActionButton,
  },
]
export default function WalletInfo() {
  const theme = useTheme()
  return (
    <Section
      title={
        <RowFit gap="4px" color={theme.subText}>
          <Wallet />
          <Trans>Wallet</Trans>
        </RowFit>
      }
    >
      <Table
        data={new Array(10).fill({ token: 123, balance: 111 })}
        columns={columns}
        style={{ flex: 1 }}
        totalItems={10}
      />
    </Section>
  ) // todo update SectionWrapper can reuse
}
