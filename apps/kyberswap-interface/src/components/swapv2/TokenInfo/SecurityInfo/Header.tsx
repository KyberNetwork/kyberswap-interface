import { ReactNode } from 'react'
import { AlertOctagon } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

const Label = styled.span`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 400;
`

const BadgeWarning = ({ warning, danger }: { warning: number; danger: number }) => {
  const theme = useTheme()
  return (
    <Flex alignItems={'center'} sx={{ gap: '10px' }}>
      {danger > 0 && (
        <Flex alignItems={'center'} sx={{ gap: '4px' }} color={theme.red} fontSize={'14px'}>
          <AlertOctagon size={16} /> {danger}
        </Flex>
      )}
      {warning > 0 && (
        <Flex alignItems={'center'} sx={{ gap: '4px' }} color={theme.warning} fontSize={'14px'}>
          <AlertOctagon size={16} /> {warning}
        </Flex>
      )}
    </Flex>
  )
}

const Header = ({
  warning,
  danger,
  title,
  icon,
}: {
  warning: number
  danger: number
  title: string
  icon: ReactNode
}) => {
  return (
    <Flex justifyContent={'space-between'} flex={1} padding={'12px 0 12px 16px'}>
      <Flex alignItems={'center'} sx={{ gap: '6px' }}>
        {icon}
        <Label>{title}</Label>
      </Flex>
      <BadgeWarning warning={warning} danger={danger} />
    </Flex>
  )
}

export default Header
