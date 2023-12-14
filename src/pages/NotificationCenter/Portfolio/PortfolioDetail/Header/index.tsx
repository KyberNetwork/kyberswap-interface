import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import { css } from 'styled-components'

import DefaultAvatar from 'assets/images/default_avatar.png'
import { NotificationType } from 'components/Announcement/type'
import { DropdownArrowIcon } from 'components/ArrowRotate'
import Badge, { BadgeVariant } from 'components/Badge'
import { ProfilePanel } from 'components/Header/web3/SignWallet/ProfileContent'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import MenuFlyout from 'components/MenuFlyout'
import { RowBetween, RowFit } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import Search from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Header/Search'
import { PortfolioInfos } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/useFetchPortfolio'
import { useParseWalletPortfolioParam } from 'pages/NotificationCenter/Portfolio/helpers'
import { Portfolio, PortfolioWalletBalanceResponse } from 'pages/NotificationCenter/Portfolio/type'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { useNotify } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber } from 'utils/numbers'
import { shortString } from 'utils/string'

const browserCustomStyle = css`
  padding: 0;
  border-radius: 20px;
  top: 120px;
  right: unset;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 3.5rem;
  `};
`

export default function Header({
  balance,
  portfolioInfos: { portfolioOptions, portfolio: activePortfolio, isLoading },
}: {
  balance: PortfolioWalletBalanceResponse | undefined
  portfolioInfos: PortfolioInfos
}) {
  const theme = useTheme()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const isMyPortfolioPage = pathname.startsWith(APP_PATHS.MY_PORTFOLIO)
  const { wallet, portfolioId } = useParseWalletPortfolioParam()
  const { search } = useParsedQueryString<{ search: string }>()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const totalUsd = balance?.totalUsd || 0

  const notify = useNotify()
  const onClickPortfolio = useCallback(
    (data: Portfolio) => {
      navigate(`${APP_PATHS.MY_PORTFOLIO}/${data.id}`)
      setIsOpen(false)
      const portfolioName = data.name
      notify({
        title: t`Portfolio switched`,
        summary: t`Switched successfully to ${portfolioName}`,
        type: NotificationType.SUCCESS,
      })
    },
    [navigate, notify],
  )

  const renderAction = useCallback(
    () => (
      <TransactionSettingsIcon
        style={{ marginRight: upToMedium ? 0 : '10px', color: theme.subText }}
        size={22}
        onClick={e => {
          e?.stopPropagation()
          setIsOpen(!isOpen)
          navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`)
        }}
      />
    ),
    [isOpen, theme, upToMedium, navigate],
  )

  const formatPortfolio = useMemo(() => {
    return portfolioOptions
      .filter(e => !e.active)
      .map(({ portfolio, totalUsd }) => ({
        data: {
          ...portfolio,
          title: portfolio.name,
          description: formatDisplayNumber(totalUsd, { style: 'currency', fractionDigits: 2 }),
          avatarUrl: '',
        },
        // todo raw data field instead ?
        renderAction,
        onClick: onClickPortfolio,
      }))
  }, [portfolioOptions, renderAction, onClickPortfolio])

  const accountText = (
    <Flex
      fontSize={'20px'}
      fontWeight={'500'}
      color={theme.text}
      sx={{
        userSelect: 'none',
        whiteSpace: 'nowrap',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {isLoading ? '--' : shortString(activePortfolio?.name || '', upToSmall ? 20 : 50) || getShortenAddress(wallet)}{' '}
      {portfolioId || wallet ? (
        <Badge
          variant={portfolioId ? BadgeVariant.BLUE : BadgeVariant.DEFAULT}
          style={{ fontSize: '10px', background: portfolioId ? undefined : rgba(theme.subText, 0.2) }}
        >
          {portfolioId ? <Trans>Portfolio</Trans> : <Trans>Wallet</Trans>}
        </Badge>
      ) : (
        <Trans>My Portfolio</Trans>
      )}
    </Flex>
  )

  return (
    <>
      {upToSmall && <Search />}
      <RowBetween align="center">
        <Flex color={theme.text} fontSize={'24px'} fontWeight={'500'} alignItems={'center'} sx={{ gap: '4px' }}>
          {search && <ChevronLeft style={{ cursor: 'pointer', minWidth: 24 }} onClick={() => navigate(-1)} />}

          {isLoading || !isMyPortfolioPage || formatPortfolio.length === 0 ? (
            accountText
          ) : (
            <MenuFlyout
              trigger={
                <RowFit sx={{ cursor: 'pointer' }}>
                  {accountText}
                  {formatPortfolio.length > 0 && <DropdownArrowIcon rotate={isOpen} />}
                </RowFit>
              }
              customStyle={browserCustomStyle}
              isOpen={isOpen}
              toggle={() => setIsOpen(!isOpen)}
            >
              <ProfilePanel
                scroll
                options={formatPortfolio}
                activeItem={{
                  onClick: () => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`),
                  actionLabel: t`Portfolio Settings`,
                  data: {
                    title: activePortfolio?.name,
                    description: formatDisplayNumber(totalUsd, { style: 'currency', fractionDigits: 2 }),
                    avatarUrl: DefaultAvatar,
                  },
                }}
              />
            </MenuFlyout>
          )}
        </Flex>

        {!upToSmall && <Search />}
      </RowBetween>
    </>
  )
}
