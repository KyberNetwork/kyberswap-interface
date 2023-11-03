import KyberOauth2, { LoginMethod } from '@kybernetwork/oauth2'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import { LogOut, UserPlus } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import Avatar from 'components/Avatar'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Row, { RowBetween } from 'components/Row'
import CardBackground from 'components/WalletPopup/AccountInfo/CardBackground'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { ConnectedProfile, useProfileInfo } from 'state/profile/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isAddressString } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'
import { shortString } from 'utils/string'

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 320px;
  padding: 16px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
      padding: 14px;
      gap: 8px;
  `}
`

const ListProfile = styled.div<{ hasData: boolean; scroll?: boolean }>`
  padding: ${({ hasData }) => hasData && `12px 0`};
  ${({ scroll }) =>
    scroll &&
    css`
      max-height: 400px;
      overflow-y: scroll;
      overflow-x: hidden;
      &::-webkit-scrollbar {
        display: block;
        width: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.border};
      }
    `};
`

const ActionItem = styled.div`
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 24px;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
  gap: 6px;
  width: 100%;
  padding: 12px;
  :hover {
    background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  }
`

const ActionWrapper = styled.div<{ hasBorder: boolean }>`
  display: flex;
  padding: 12px 0px 0px 0px;
  flex-direction: column;
  justify-content: space-between;
  border-top: ${({ theme, hasBorder }) => hasBorder && `1px solid ${theme.border}`};
  ${({ theme }) => theme.mediaWidth.upToMedium`
      padding: 10px 14px;
  `}
`

const ProfileItemWrapper = styled(RowBetween)<{ active: boolean }>`
  position: relative;
  cursor: pointer;
  ${({ active }) =>
    active
      ? css`
          padding: 14px;
          flex-direction: column;
          gap: 16px;
          border-radius: 20px;
          cursor: unset;
        `
      : css`
          padding: 10px 0px;
          border-bottom: none;
          border-radius: 8px;
          :hover {
            background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
          }
        `}
  ${({ theme, active }) => theme.mediaWidth.upToMedium`
     ${
       active
         ? css`
             padding: 16px 20px;
           `
         : css`
             padding: 10px 20px;
           `
     }}
      
  `}
`
type DisplayProps = { title: string | undefined; description: string; avatarUrl: string | undefined }

type ItemProps = {
  data: DisplayProps
  onClick: (data: any) => void
  renderAction?: (data: any) => ReactNode
  actionLabel?: string
}

const ProfileItem = ({ data, onClick, renderAction }: ItemProps) => {
  const { title, description, avatarUrl } = data
  const theme = useTheme()
  const [loading, setLoading] = useState(false)

  const wrappedOnClick = async () => {
    if (loading) return
    setLoading(true)
    await onClick(data)
    setLoading(false)
  }

  return (
    <ProfileItemWrapper active={false} onClick={wrappedOnClick}>
      <Row width={'100%'} style={{ zIndex: 1 }}>
        <Row gap={'12px'} align="center">
          <Flex style={{ width: 54, minWidth: 54 }} justifyContent="center">
            <Avatar url={avatarUrl} size={40} color={theme.subText} loading={loading} />
          </Flex>
          <Column gap="8px" minWidth={'unset'} flex={1}>
            {title && (
              <Text fontWeight={'bold'} fontSize={'16px'} color={theme.subText}>
                {shortString(title ?? '', 18)}
              </Text>
            )}
            <Text fontWeight={'500'} fontSize={title ? '12px' : '16px'} color={theme.subText}>
              {description}
            </Text>
          </Column>
        </Row>
        {renderAction?.(data)}
      </Row>
    </ProfileItemWrapper>
  )
}

const ProfileItemActive = ({ data, onClick, actionLabel }: ItemProps) => {
  const theme = useTheme()
  if (!data) return null
  const { title, description, avatarUrl } = data
  return (
    <ProfileItemWrapper active>
      <CardBackground noLogo />
      <Row width={'100%'} style={{ zIndex: 1 }}>
        <Row gap={'16px'} align="center">
          <Flex style={{ width: 54, minWidth: 54 }} justifyContent="center">
            <Avatar url={avatarUrl} size={54} color={theme.text} />
          </Flex>
          <Column gap="8px" minWidth={'unset'} flex={1}>
            {title && (
              <Text fontWeight={'bold'} fontSize={'20px'} color={theme.text}>
                {shortString(title ?? '', 18)}
              </Text>
            )}
            <Text fontWeight={'500'} fontSize={'16px'} color={theme.subText}>
              {description}
            </Text>
          </Column>
        </Row>
      </Row>

      <Row width={'100%'}>
        <ButtonLight
          height={'36px'}
          style={{ flex: 1 }}
          onClick={e => {
            e?.stopPropagation()
            onClick(data)
          }}
        >
          <TransactionSettingsIcon size={20} fill={theme.primary} />
          &nbsp;
          {actionLabel}
        </ButtonLight>
      </Row>
    </ProfileItemWrapper>
  )
}

const ProfileContent = ({ scroll, toggleModal }: { scroll?: boolean; toggleModal: () => void }) => {
  const { signIn, signOutAll, signOut } = useLogin()
  const { profiles, totalGuest } = useProfileInfo()
  const { account, isEVM } = useActiveWeb3React()
  const theme = useTheme()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const navigate = useNavigate()

  const renderAction = useCallback(
    ({ id, type }: ConnectedProfile) => {
      const guest = type === LoginMethod.ANONYMOUS
      return (guest ? totalGuest > 1 : true) ? (
        <LogOut
          style={{ marginRight: upToMedium ? 0 : '10px' }}
          color={theme.subText}
          size={16}
          onClick={e => {
            e?.stopPropagation()
            signOut(id, guest)
          }}
        />
      ) : null
    },
    [signOut, totalGuest, theme, upToMedium],
  )

  const onItemClick = useCallback(
    async (profile: ConnectedProfile) => {
      await signIn({
        account: profile.id,
        loginMethod: profile.type,
        showSessionExpired: true,
      })
      toggleModal()
    },
    [signIn, toggleModal],
  )
  const onItemActiveClick = useCallback(() => {
    navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PROFILE}`)
    toggleModal()
  }, [navigate, toggleModal])

  const formatProfile = useMemo(
    () =>
      profiles.map(el => ({
        data: {
          ...el,
          title: el.profile?.nickname,
          avatarUrl: el.profile?.avatarUrl,
          description: isAddressString(1, el.name) ? getShortenAddress(el.name) : shortString(el.name, 20),
        },
        actionLabel: t`Edit current account`,
        renderAction,
        onClick: el.active ? onItemActiveClick : onItemClick,
      })),
    [profiles, renderAction, onItemClick, onItemActiveClick],
  )

  if (!profiles.length) return null

  const listNotActive = formatProfile.slice(1)
  const totalAccount = formatProfile.length

  return (
    <ProfilePanel
      scroll={!!scroll}
      activeItem={formatProfile[0]}
      actions={
        <ActionWrapper hasBorder={profiles.length > 1}>
          {!KyberOauth2.getConnectedAccounts().includes(account?.toLowerCase() ?? '') && isEVM && (
            <ActionItem
              onClick={() => {
                toggleModal()
                signIn()
              }}
            >
              <UserPlus size={18} /> <Trans>Add Account</Trans>
            </ActionItem>
          )}
          {totalAccount > 1 && (
            <ActionItem
              onClick={() => {
                signOutAll()
                toggleModal()
              }}
            >
              <LogOut size={18} /> <Trans>Sign out of all accounts</Trans>
            </ActionItem>
          )}
        </ActionWrapper>
      }
      options={listNotActive}
    />
  )
}

type Props = {
  scroll: boolean
  actions?: ReactNode
  options: ItemProps[]
  activeItem: ItemProps
}

export function ProfilePanel({ scroll, actions, activeItem, options = [] }: Props) {
  return (
    <ContentWrapper>
      <Column>
        <ProfileItemActive {...activeItem} />
        <ListProfile hasData={!!options.length} scroll={scroll}>
          {options.map((el, i) => (
            <ProfileItem {...el} key={i} />
          ))}
        </ListProfile>
      </Column>
      {actions}
    </ContentWrapper>
  )
}
export default ProfileContent
