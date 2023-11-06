import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { isMacOs } from 'react-device-detect'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as PortfolioIcon } from 'assets/svg/portfolio.svg'
import Avatar from 'components/Avatar'
import { ButtonOutlined } from 'components/Button'
import History from 'components/Icons/History'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Row, { RowBetween, RowFit } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useNavigateToPortfolioDetail } from 'pages/NotificationCenter/Portfolio/PortfolioItem'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { SearchWithDropdown } from 'pages/TrueSightV2/components/SearchWithDropDown'
import { StarWithAnimation } from 'pages/TrueSightV2/components/WatchlistStar'
import { formatDisplayNumber } from 'utils/numbers'

const ShortCut = styled.span`
  background-color: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.subText};
  border-radius: 16px;
  padding: 2px 8px;
  font-size: 10px;
`

const columns = [
  { align: 'left', label: 'Value', style: { width: '100px', minWidth: 'auto' } },
  { align: 'right', label: '24H', style: { width: '60px' } },
]
const DropdownItem = styled.tr`
  padding: 6px;
  background-color: ${({ theme }) => theme.tableHeader};
  height: 36px;
  font-size: 12px;
  font-weight: 400;
  :hover {
    filter: brightness(1.3);
  }
`
const PortfolioItem = ({ onSelect }: { onSelect: () => void }) => {
  const theme = useTheme()
  const percent = 123.23
  const navigate = useNavigateToPortfolioDetail()
  const address = '0x53beBc978F5AfC70aC3bFfaD7bbD88A351123723'

  return (
    <DropdownItem
      onClick={() => {
        navigate({ wallet: address })
        onSelect()
      }}
    >
      <td>
        <Row alignItems="center" gap="6px">
          <StarWithAnimation size={18} active />
          <Avatar url="" color={theme.subText} size={16} />
          <Text color={theme.subText}>{address}</Text>
        </Row>
      </td>
      <td>
        <Text color={theme.subText}>{formatDisplayNumber(1234567.23, { style: 'decimal', fractionDigits: 2 })}</Text>
      </td>
      <td style={{ textAlign: 'right' }}>
        <Text color={percent > 0 ? theme.primary : theme.red}>
          {formatDisplayNumber(percent, { style: 'percent', fractionDigits: 2 })}
        </Text>
      </td>
    </DropdownItem>
  )
}

export default function Header() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)
  const history = false
  const mocks = new Array(4).fill(12).map(el => <PortfolioItem key={el} onSelect={() => setExpanded(false)} />)
  const sections = history
    ? [
        {
          title: (
            <RowFit color={theme.subText} gap="10px">
              <History />
              <Text fontSize="12px">Search History</Text>
            </RowFit>
          ),
          items: [],
          renderWhenEmpty: !!history,
        },
      ]
    : [
        {
          title: (
            <RowFit color={theme.subText} gap="10px">
              <History />
              <Text fontSize="12px">Favorites</Text>
            </RowFit>
          ),
          items: mocks,
        },
        {
          title: (
            <RowFit color={theme.subText} gap="10px">
              <History />
              <Text fontSize="12px">Trending</Text>
            </RowFit>
          ),
          items: mocks,
        },
      ]

  return (
    <>
      <RowBetween align="center">
        <Flex color={theme.text} fontSize={'24px'} fontWeight={'500'} alignItems={'center'} sx={{ gap: '4px' }}>
          <PortfolioIcon />
          <Trans>My Portfolio</Trans>
        </Flex>
        <Row width={'fit-content'} gap="15px">
          <SearchWithDropdown
            searching={false}
            noResultText={t`No portfolio found.`}
            expanded={expanded}
            setExpanded={setExpanded}
            placeholder={t`Enter wallet address`}
            sections={sections}
            columns={columns}
            value={search}
            noSearchResult={false}
            onChange={setSearch}
            searchIcon={<ShortCut>{isMacOs ? 'Cmd+K' : 'Ctrl+K'}</ShortCut>}
          />
          <ButtonOutlined
            height={'36px'}
            width={'116px'}
            onClick={() => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`)}
          >
            <TransactionSettingsIcon fill={theme.subText} />
            &nbsp;
            <Trans>Setting</Trans>
          </ButtonOutlined>
        </Row>
      </RowBetween>
    </>
  )
}
