import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Eye, EyeOff, Plus, Share2, Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import DefaultAvatar from 'assets/images/default_avatar.png'
import { DropdownArrowIcon } from 'components/ArrowRotate'
import Avatar from 'components/Avatar'
import { PercentBadge } from 'components/Badge'
import { ButtonAction, ButtonPrimary } from 'components/Button'
import { ProfilePanel } from 'components/Header/web3/SignWallet/ProfileContent'
import Wallet from 'components/Icons/Wallet'
import MenuFlyout from 'components/MenuFlyout'
import Row, { RowBetween, RowFit } from 'components/Row'
import Select from 'components/Select'
import { APP_PATHS, EMPTY_ARRAY } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { Portfolio, PortfolioWalletBalanceResponse } from 'pages/NotificationCenter/Portfolio/type'
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
}: {
  portfolios: Portfolio[]
  activePortfolio: Portfolio
  onChangeWallet: (v: string) => void
  data: PortfolioWalletBalanceResponse | undefined
}) => {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const [showBalance, setShowBalance] = useState(true)
  const percent = 0.22332

  const navigate = useNavigate()
  const test = true
  const [isOpen, setIsOpen] = useState(false)

  const { lastUpdatedAt, totalBalanceUsd } = data || {}

  const accountText = (
    <Text fontSize={'20px'} fontWeight={'500'} color={theme.text} sx={{ cursor: 'pointer', userSelect: 'none' }}>
      {getShortenAddress(account ?? '')}
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
      navigate(`${APP_PATHS.PORTFOLIO}/${data.id}`)
      setIsOpen(false)
    },
    [navigate],
  )

  const formatPortfolio = useMemo(() => {
    return portfolios.map(el => ({
      data: { ...el, title: 'test', description: 'test', avatarUrl: '' },
      // todo raw data field instead ?
      renderAction,
      onClick: onClickPortfolio,
    }))
  }, [portfolios, renderAction, onClickPortfolio])

  console.log(123, formatPortfolio)

  const wallets = useMemo(() => {
    if (!activePortfolio) return EMPTY_ARRAY
    const opt = activePortfolio.wallets.map(wallet => ({
      label: wallet.nickName || getShortenAddress(wallet.walletAddress),
      value: wallet.walletAddress,
    }))
    return [{ label: t`All Wallets`, value: '' }, ...opt]
  }, [activePortfolio])

  return (
    <>
      <RowBetween>
        {test ? (
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
                  title: 'test',
                  description: formatDisplayNumber(123.123, { style: 'currency', fractionDigits: 2 }),
                  avatarUrl: DefaultAvatar,
                },
              }}
            />
          </MenuFlyout>
        ) : (
          accountText
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
            <PercentBadge percent={percent} />
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

        {activePortfolio ? (
          <Select
            onChange={onChangeWallet}
            style={{ borderRadius: 24, background: theme.buttonGray, height: 36, minWidth: 150 }}
            options={wallets}
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
