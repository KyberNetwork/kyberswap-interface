import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Eye, EyeOff, Plus, Share2 } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Avatar from 'components/Avatar'
import { PercentBadge } from 'components/Badge'
import { ButtonAction, ButtonPrimary } from 'components/Button'
import { RowBetween } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber } from 'utils/numbers'

const BalanceGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`
const AddressPanel = () => {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const [showBalance, setShowBalance] = useState(true)
  const percent = 0.22332
  const balance = 1234564646.23
  const navigate = useNavigate()
  return (
    <>
      {account && (
        <RowBetween>
          <Text fontSize={'20px'} fontWeight={'500'} color={theme.text}>
            {getShortenAddress(account)}
          </Text>
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
