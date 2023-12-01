import { Trans } from '@lingui/macro'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as PortfolioIcon } from 'assets/svg/portfolio.svg'
import { ButtonOutlined } from 'components/Button'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Row, { RowBetween } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import Search from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Header/Search'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { MEDIA_WIDTHS } from 'theme'

export default function Header() {
  const theme = useTheme()
  const navigate = useNavigate()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { pathname } = useLocation()

  return (
    <>
      <RowBetween align="center">
        <Flex color={theme.text} fontSize={'24px'} fontWeight={'500'} alignItems={'center'} sx={{ gap: '4px' }}>
          <PortfolioIcon />
          <Text sx={{ whiteSpace: 'nowrap' }}>
            {pathname.startsWith(APP_PATHS.MY_PORTFOLIO) ? <Trans>My Portfolio</Trans> : <Trans>Portfolio</Trans>}
          </Text>
        </Flex>
        <Row width={'fit-content'} gap="15px">
          {!upToSmall && <Search />}
          <ButtonOutlined
            height={'36px'}
            width={upToSmall ? '36px' : '116px'}
            style={{ background: theme.buttonGray, border: 'none', minWidth: '36px' }}
            onClick={() => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`)}
          >
            <TransactionSettingsIcon fill={theme.subText} style={{ height: '20px', minWidth: '20px' }} />
            {!upToSmall && (
              <>
                &nbsp;<Trans>Settings</Trans>
              </>
            )}
          </ButtonOutlined>
        </Row>
      </RowBetween>
      {upToSmall && <Search />}
    </>
  )
}
