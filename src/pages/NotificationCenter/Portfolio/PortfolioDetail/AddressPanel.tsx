import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Clock, Eye, EyeOff, Plus, Share2 } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import DefaultAvatar from 'assets/images/default_avatar.png'
import Avatar from 'components/Avatar'
import Badge from 'components/Badge'
import { ButtonAction, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Row, { RowBetween, RowFit } from 'components/Row'
import Select, { SelectOption } from 'components/Select'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useInterval from 'hooks/useInterval'
import useTheme from 'hooks/useTheme'
import AddWalletPortfolioModal from 'pages/NotificationCenter/Portfolio/Modals/AddWalletPortfolioModal'
import { PortfolioInfos } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/useFetchPortfolio'
import { MAXIMUM_PORTFOLIO, PORTFOLIO_POLLING_INTERVAL } from 'pages/NotificationCenter/Portfolio/const'
import { useAddWalletToPortfolio, useParseWalletPortfolioParam } from 'pages/NotificationCenter/Portfolio/helpers'
import {
  Portfolio,
  PortfolioWalletBalanceResponse,
  PortfolioWalletPayload,
} from 'pages/NotificationCenter/Portfolio/type'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'
import { shortString } from 'utils/string'
import { formatRemainTime } from 'utils/time'

const BalanceGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`

const ActionGroups = styled(Row)`
  gap: 12px;
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

const ButtonCreatePortfolio = ({ portfolioOptions }: { portfolioOptions: PortfolioOption[] }) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { wallet, portfolioId } = useParseWalletPortfolioParam()
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const navigate = useNavigate()
  const [walletInfo, setWalletInfo] = useState<{ walletAddress: string; portfolioId: string }>({
    walletAddress: '',
    portfolioId: '',
  })
  const onDismiss = () => {
    setWalletInfo({ walletAddress: '', portfolioId: '' })
  }
  const _onAddWallet = useAddWalletToPortfolio()
  const onAddWallet = (data: PortfolioWalletPayload) => _onAddWallet({ ...data, portfolioId: walletInfo.portfolioId })

  const isMaximum = portfolioOptions.length >= MAXIMUM_PORTFOLIO && !!portfolioId

  const addWalletOptions: SelectOption[] = useMemo(() => {
    const opts = portfolioOptions.map(({ portfolio, totalUsd }) => ({
      label: shortString(portfolio.name, 30),
      onSelect: () => {
        setWalletInfo({ walletAddress: wallet, portfolioId: portfolio.id })
      },
      subLabel: formatDisplayNumber(totalUsd, { style: 'currency', fractionDigits: 2 }),
    }))
    if (opts.length < MAXIMUM_PORTFOLIO) {
      opts.push({
        label: t`A new portfolio`,
        onSelect: () => {
          navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}?wallet=${wallet}`)
        },
        subLabel: '',
      })
    }
    return opts
  }, [portfolioOptions, wallet, navigate])

  if (!account || portfolioOptions.some(({ portfolio }) => portfolio.id === portfolioId) || isMaximum) {
    // visit my portfolio or not connect wallet
    return (
      <MouseoverTooltip
        containerStyle={{
          flex: upToSmall ? 1 : undefined,
        }}
        text={
          !account ? (
            t`Connect your wallet to create portfolio.`
          ) : isMaximum ? (
            <Trans>
              You can only create up to 2 portfolios. Manage your portfolios{' '}
              <Text
                fontWeight={'500'}
                onClick={() => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`)}
                color={theme.primary}
                sx={{ cursor: 'pointer' }}
              >
                here
              </Text>
            </Trans>
          ) : (
            ''
          )
        }
        placement="top"
      >
        <ButtonPrimary
          height={'36px'}
          width={'fit-content'}
          disabled={!account || isMaximum}
          onClick={() => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}?autoShowCreate=1`)}
        >
          <Plus size={18} />
          &nbsp;
          <Trans>Create Portfolio</Trans>
        </ButtonPrimary>
      </MouseoverTooltip>
    )
  }

  const addPortfolioOptions = [
    {
      label: t`Replicate this portfolio`,
      onSelect: () => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}?cloneId=${portfolioId}`),
    },
    {
      label: t`Create a blank portfolio`,
      onSelect: () => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`),
    },
  ]

  const props = {
    arrowColor: theme.textReverse,
    style: {
      background: theme.primary,
      borderRadius: 999,
      height: 36,
      fontWeight: '500',
      fontSize: 14,
      flex: upToSmall ? 1 : undefined,
    },
  }

  if (wallet) {
    return (
      <>
        <Select
          {...props}
          menuStyle={{ minWidth: 280 }}
          options={addWalletOptions}
          activeRender={() => (
            <Row color={theme.textReverse}>
              <Plus size={18} />
              &nbsp;
              <Trans>Add Wallet</Trans>
            </Row>
          )}
          optionRender={item => {
            return (
              <Column gap="4px" sx={{ minHeight: '40px' }} justifyContent={'center'}>
                <Text fontSize={'16px'}>{item?.label}</Text>
                {item?.subLabel && <Text fontSize={'12px'}>{item?.subLabel}</Text>}
              </Column>
            )
          }}
          dropdownRender={menu => {
            return (
              <Column>
                <Text color={theme.subText} fontSize={'14px'} sx={{ padding: '12px 8px' }}>
                  <Trans>Add wallet to</Trans>:
                </Text>
                <div>{menu}</div>
              </Column>
            )
          }}
        />
        <AddWalletPortfolioModal
          isOpen={!!walletInfo?.walletAddress}
          onDismiss={onDismiss}
          onConfirm={onAddWallet}
          defaultWallet={walletInfo?.walletAddress}
        />
      </>
    )
  }

  return (
    <Select
      {...props}
      options={addPortfolioOptions}
      activeRender={() => (
        <Row color={theme.textReverse}>
          <Plus size={18} />
          &nbsp;
          <Trans>Create Portfolio</Trans>
        </Row>
      )}
    />
  )
}

const StyledAction = styled(ButtonAction)`
  background: ${({ theme }) => theme.buttonGray};
  min-width: 34px;
  height: 34px;
  display: flex;
  justify-content: center;
`

export type PortfolioOption = { portfolio: Portfolio; totalUsd: number; active: boolean }

const getRemainTime = (lastRefreshTime: number | undefined) =>
  lastRefreshTime ? PORTFOLIO_POLLING_INTERVAL / 1000 - Math.floor((Date.now() - lastRefreshTime) / 1000) : 0

const AddressPanel = ({
  balance,
  onShare,
  portfolioInfos: { portfolio: activePortfolio, portfolioOptions },
  lastRefreshTime,
}: {
  onChangeWallet: (v: string) => void
  balance: PortfolioWalletBalanceResponse | undefined
  onShare: () => void
  portfolioInfos: PortfolioInfos
  lastRefreshTime: number | undefined
}) => {
  const theme = useTheme()
  const [showBalance, setShowBalance] = useState(true)
  const navigate = useNavigate()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [lastTime, setLastTime] = useState(0)
  useInterval(() => setLastTime(() => getRemainTime(lastRefreshTime)), lastRefreshTime ? 1000 : null)

  return (
    <>
      <RowBetween flexDirection={upToSmall ? 'column' : 'row'} align={upToSmall ? 'flex-start' : 'center'} gap="8px">
        <RowFit gap="16px">
          <BalanceGroup>
            <Flex sx={{ gap: '12px', alignItems: 'center' }}>
              {!upToSmall && <Avatar url={activePortfolio ? DefaultAvatar : ''} size={36} color={theme.subText} />}
              <Text fontSize={'28px'} fontWeight={'500'}>
                {showBalance
                  ? formatDisplayNumber(balance?.totalUsd || 0, { style: 'currency', fractionDigits: 2 })
                  : '******'}
              </Text>
            </Flex>
          </BalanceGroup>

          <RowFit fontSize={'12px'} color={theme.subText} fontStyle={'italic'} gap="4px">
            <Trans>
              Refresh in:{' '}
              <Badge>
                <Clock size={14} />
                <Text as="span">&nbsp;{lastTime ? formatRemainTime(lastTime, false) : '--:--'}</Text>
              </Badge>
            </Trans>
          </RowFit>
        </RowFit>

        <ActionGroups>
          <StyledAction onClick={() => setShowBalance(!showBalance)}>
            {showBalance ? <EyeOff size={18} color={theme.subText} /> : <Eye size={18} color={theme.subText} />}
          </StyledAction>
          <StyledAction onClick={onShare}>
            <Share2 color={theme.subText} size={18} />
          </StyledAction>
          <StyledAction onClick={() => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`)}>
            <TransactionSettingsIcon fill={theme.subText} style={{ height: '20px', minWidth: '20px' }} />
          </StyledAction>
          <ButtonCreatePortfolio portfolioOptions={portfolioOptions} />
        </ActionGroups>
      </RowBetween>
    </>
  )
}
export default AddressPanel
