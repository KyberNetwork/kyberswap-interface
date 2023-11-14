import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Eye, EyeOff, Plus, Share2, Trash } from 'react-feather'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import DefaultAvatar from 'assets/images/default_avatar.png'
import { DropdownArrowIcon } from 'components/ArrowRotate'
import Avatar from 'components/Avatar'
import { ButtonAction, ButtonPrimary } from 'components/Button'
import { ProfilePanel } from 'components/Header/web3/SignWallet/ProfileContent'
import Wallet from 'components/Icons/Wallet'
import MenuFlyout from 'components/MenuFlyout'
import Row, { RowBetween, RowFit } from 'components/Row'
import Select from 'components/Select'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useParseWalletPortfolioParam } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/helpers'
import { Portfolio, PortfolioWallet, PortfolioWalletBalanceResponse } from 'pages/NotificationCenter/Portfolio/type'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { MEDIA_WIDTHS } from 'theme'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber } from 'utils/numbers'
import { formatTime } from 'utils/time'

const BalanceGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`

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

const AddressPanel = ({
  portfolios,
  activePortfolio,
  onChangeWallet,
  data,
  wallets,
  isLoading,
}: {
  isLoading: boolean
  portfolios: Portfolio[]
  wallets: PortfolioWallet[]
  activePortfolio: Portfolio | undefined
  onChangeWallet: (v: string) => void
  data: PortfolioWalletBalanceResponse | undefined
}) => {
  const theme = useTheme()
  const [showBalance, setShowBalance] = useState(true)

  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()
  const isMyPortfolioPage = pathname.startsWith(APP_PATHS.MY_PORTFOLIO)
  const { wallet } = useParseWalletPortfolioParam()
  const { lastUpdatedAt, totalBalanceUsd } = data || {}

  const accountText = (
    <Text
      fontSize={'20px'}
      fontWeight={'500'}
      color={theme.text}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        maxWidth: '250px',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {isLoading ? '--' : activePortfolio?.name || getShortenAddress(wallet)}
    </Text>
  )
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const renderAction = useCallback(
    () => (
      <Trash
        style={{ marginRight: upToMedium ? 0 : '10px' }}
        color={theme.subText}
        size={16}
        onClick={e => {
          e?.stopPropagation()
          setIsOpen(!isOpen)
        }}
      />
    ),
    [isOpen, theme, upToMedium],
  )

  const onClickPortfolio = useCallback(
    (data: Portfolio) => {
      navigate(`${APP_PATHS.MY_PORTFOLIO}/${data.id}`)
      setIsOpen(false)
    },
    [navigate],
  )

  const formatPortfolio = useMemo(() => {
    return portfolios
      .filter(el => el.id !== activePortfolio?.id)
      .map(el => ({
        data: { ...el, title: el.name, description: '$123', avatarUrl: '' },
        // todo raw data field instead ?
        renderAction,
        onClick: onClickPortfolio,
      }))
  }, [portfolios, renderAction, onClickPortfolio, activePortfolio?.id])

  const walletsOpts = useMemo(() => {
    const opt = wallets.map(wallet => ({
      label: wallet.nickName || getShortenAddress(wallet.walletAddress),
      value: wallet.walletAddress,
    }))
    return [{ label: t`All Wallets`, value: '' }, ...opt]
  }, [wallets])

  return (
    <>
      <RowBetween>
        {isLoading || !isMyPortfolioPage ? (
          accountText
        ) : (
          <MenuFlyout
            trigger={
              <RowFit>
                {accountText}
                <DropdownArrowIcon rotate={isOpen} />
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
                  description: formatDisplayNumber(123.123, { style: 'currency', fractionDigits: 2 }),
                  avatarUrl: DefaultAvatar,
                },
              }}
            />
          </MenuFlyout>
        )}

        {lastUpdatedAt && (
          <Text fontSize={'12px'} color={theme.subText} fontStyle={'italic'}>
            <Trans>Data last refreshed: {formatTime(lastUpdatedAt)}</Trans>
          </Text>
        )}
      </RowBetween>
      <RowBetween>
        <BalanceGroup>
          <Flex sx={{ gap: '12px', alignItems: 'center' }}>
            <Avatar url={activePortfolio ? DefaultAvatar : ''} size={36} color={theme.subText} />
            <Text fontSize={'28px'} fontWeight={'500'}>
              {showBalance
                ? formatDisplayNumber(totalBalanceUsd, { style: 'currency', significantDigits: 3 })
                : '******'}
            </Text>
          </Flex>
          <Flex sx={{ gap: '8px' }}>
            <ButtonAction style={{ padding: '8px' }} onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <EyeOff size={20} color={theme.subText} /> : <Eye size={20} color={theme.subText} />}
            </ButtonAction>
            <ButtonAction style={{ padding: '8px' }}>
              <Share2 color={theme.subText} size={20} />
            </ButtonAction>
          </Flex>
        </BalanceGroup>

        {walletsOpts.length ? (
          <Select
            onChange={onChangeWallet}
            style={{ borderRadius: 24, background: theme.buttonGray, height: 36, minWidth: 150 }}
            options={walletsOpts}
            activeRender={item => (
              <Row gap="4px">
                <Wallet />
                {item?.label}
              </Row>
            )}
          />
        ) : (
          <ButtonPrimary
            height={'36px'}
            width={'fit-content'}
            onClick={() => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`)}
          >
            <Plus />
            &nbsp;
            <Trans>Create Portfolio</Trans>
          </ButtonPrimary>
        )}
      </RowBetween>
    </>
  )
}
export default AddressPanel
