import { Fragment, ReactNode } from 'react'
import { FileText } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { ReactComponent as NftIcon } from 'assets/svg/nft_icon.svg'
import { ReactComponent as TokensIcon } from 'assets/svg/tokens_icon.svg'
import { CheckCircle } from 'components/Icons'
import Row, { RowFit } from 'components/Row'
import Select from 'components/Select'
import useTheme from 'hooks/useTheme'
import { PortfolioTab } from 'pages/NotificationCenter/Portfolio/type'
import { MEDIA_WIDTHS } from 'theme'

const Divider = styled.div`
  height: 20px;
  width: 2px;
  background-color: ${({ theme }) => theme.border};
`
type TabType = { value: PortfolioTab; icon: ReactNode }
const TabItem = ({
  data: { icon, value },
  active,
  onClick,
}: {
  active: boolean
  onClick: () => void
  data: TabType
}) => {
  const theme = useTheme()
  return (
    <Flex
      color={active ? theme.primary : theme.subText}
      alignItems={'center'}
      sx={{ cursor: 'pointer', gap: '6px' }}
      onClick={onClick}
    >
      {icon}
      <Text as="span" fontSize={'24px'} fontWeight={'500'}>
        {value}
      </Text>
    </Flex>
  )
}

const options = [
  { value: PortfolioTab.TOKEN, icon: <TokensIcon /> },
  { value: PortfolioTab.LIQUIDITY, icon: <LiquidityIcon style={{ width: 16, height: 16 }} /> },
  { value: PortfolioTab.NFT, icon: <NftIcon style={{ width: 16, height: 16 }} /> },
  { value: PortfolioTab.TRANSACTIONS, icon: <FileText size={16} /> },
  { value: PortfolioTab.ALLOWANCES, icon: <CheckCircle size={'16px'} /> },
]
const selectOptions = options.map(e => ({
  ...e,
  label: (
    <Row alignItems={'center'} fontSize={'14px'} gap="8px" fontWeight={'500'}>
      {e.icon} {e.value}
    </Row>
  ),
}))
export default function ListTab({ activeTab, setTab }: { activeTab: PortfolioTab; setTab: (v: PortfolioTab) => void }) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const theme = useTheme()
  if (upToSmall)
    return (
      <Select
        onChange={setTab}
        options={selectOptions}
        style={{ background: theme.buttonGray, height: '36px', borderRadius: 24, width: '100%' }}
      />
    )
  return (
    <RowFit gap="10px" align="center">
      {options.map((item, i) => (
        <Fragment key={item.value}>
          <TabItem data={item} active={item.value === activeTab} onClick={() => setTab(item.value)} />
          {i !== options.length - 1 ? <Divider /> : null}
        </Fragment>
      ))}
    </RowFit>
  )
}
