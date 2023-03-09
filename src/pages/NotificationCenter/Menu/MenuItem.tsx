import { Link, useLocation } from 'react-router-dom'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

const IconWrapper = styled.div`
  height: 16px;
  flex: 0 0 16px;
  justify-content: center;
  align-items: center;
`

const Label = styled.span`
  font-weight: 500;
  font-size: 14px;
  overflow-wrap: break-word;
`

const Badge = styled.div`
  padding: 2px 4px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  background: ${({ theme }) => theme.subText};
  color: ${({ theme }) => theme.textReverse};
`

type ActiveProps = {
  $active: boolean
}
const Wrapper = styled.div.attrs<ActiveProps>(props => ({
  'data-active': props.$active,
}))<ActiveProps>`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  padding: 4px 0;
  cursor: pointer;

  &[data-active='true'] {
    color: ${({ theme }) => theme.primary};

    ${Badge} {
      background-color: ${({ theme }) => theme.primary};
    }
  }
`

type Props = {
  href: string
  icon: React.ReactElement
  text: string
  badgeText?: string
}

const MenuItem: React.FC<Props> = ({ icon, text, badgeText, href }) => {
  const location = useLocation()
  const theme = useTheme()

  const path = `${APP_PATHS.NOTIFICATION_CENTER}${href}`
  const isActive = location.pathname === path

  return (
    <Link to={path}>
      <Wrapper $active={isActive}>
        <Flex
          sx={{
            flex: '1 1 0',
            alignItems: 'center',
            color: isActive ? theme.primary : theme.subText,
            gap: '8px',
          }}
        >
          <IconWrapper>{icon}</IconWrapper>
          <Label>{text}</Label>
        </Flex>

        {badgeText ? <Badge>{badgeText}</Badge> : null}
      </Wrapper>
    </Link>
  )
}

export default MenuItem
