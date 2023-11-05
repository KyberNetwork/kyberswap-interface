import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { Eye, EyeOff, Plus, Share2, Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { DropdownArrowIcon } from 'components/ArrowRotate'
import Avatar from 'components/Avatar'
import { PercentBadge } from 'components/Badge'
import { ButtonAction, ButtonPrimary } from 'components/Button'
import { ProfilePanel } from 'components/Header/web3/SignWallet/ProfileContent'
import MenuFlyout from 'components/MenuFlyout'
import { RowBetween, RowFit } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { MEDIA_WIDTHS } from 'theme'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber } from 'utils/numbers'

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

const AddressPanel = () => {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const [showBalance, setShowBalance] = useState(true)
  const percent = 0.22332
  const balance = 1234564646.23
  const navigate = useNavigate()
  const test = true
  const [isOpen, setIsOpen] = useState(false)

  const accountText = (
    <Text fontSize={'20px'} fontWeight={'500'} color={theme.text} sx={{ cursor: 'pointer', userSelect: 'none' }}>
      {getShortenAddress(account ?? '')}
    </Text>
  )
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  return (
    <>
      {account && (
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
                options={[
                  {
                    data: { title: 'test', description: 'test', avatarUrl: '' },
                    onClick: () => setIsOpen(!isOpen),
                    renderAction: () => (
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
                  },
                ]}
                activeItem={{
                  onClick: () => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`),
                  actionLabel: t`Portfolio Settings`,
                  data: {
                    title: 'test',
                    description: formatDisplayNumber(123.123, { style: 'currency', fractionDigits: 2 }),
                    avatarUrl:
                      'https://storage.googleapis.com/ks-setting-a3aa20b7/733a89b2-e3c2-42a5-af6b-f9dc139b50881698999021014.png',
                  },
                }}
              />
            </MenuFlyout>
          ) : (
            accountText
          )}

          <Text fontSize={'12px'} color={theme.subText} fontStyle={'italic'}>
            <Trans>Updated 5 mins ago.</Trans>
          </Text>
        </RowBetween>
      )}
      <RowBetween>
        <BalanceGroup>
          <Flex sx={{ gap: '12px', alignItems: 'center' }}>
            <Avatar url="" size={36} color={theme.subText} />
            <Text fontSize={'28px'} fontWeight={'500'}>
              {showBalance ? formatDisplayNumber(balance, { style: 'currency', significantDigits: 3 }) : '******'}
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

        <ButtonPrimary
          height={'36px'}
          width={'fit-content'}
          onClick={() => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`)}
        >
          <Plus />
          &nbsp;
          <Trans>Create Portfolio</Trans>
        </ButtonPrimary>
      </RowBetween>
    </>
  )
}
export default AddressPanel
