import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Text } from 'rebass'
import styled from 'styled-components'

import IconFailure from 'assets/svg/notification_icon_failure.svg'
import IconSuccess from 'assets/svg/notification_icon_success.svg'
import IconWarning from 'assets/svg/notification_icon_warning.svg'
import { NotificationType } from 'components/Announcement/type'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import useTheme from 'hooks/useTheme'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`
const mapIcon = {
  [NotificationType.SUCCESS]: IconSuccess,
  [NotificationType.WARNING]: IconWarning,
  [NotificationType.ERROR]: IconFailure,
}
export default function SimplePopup({
  title,
  summary,
  type = NotificationType.ERROR,
  icon,
  link,
}: {
  title: string
  type?: NotificationType
  summary?: ReactNode
  icon?: ReactNode
  link?: string
}) {
  const theme = useTheme()
  const mapColor = {
    [NotificationType.SUCCESS]: theme.primary,
    [NotificationType.WARNING]: theme.warning,
    [NotificationType.ERROR]: theme.red,
  }
  const color = mapColor[type]

  const navigate = useNavigate()
  const onClickLink = () => {
    link && navigate(link)
  }
  return (
    <Box>
      <RowNoFlex>
        <div style={{ paddingRight: 10 }}>
          {icon || <img src={mapIcon[type]} alt="Icon" style={{ display: 'block' }} />}
        </div>
        <AutoColumn gap="8px">
          <Text fontSize="16px" fontWeight={500} color={color}>
            {title}
          </Text>
          {summary && (
            <Text fontSize="14px" fontWeight={400} color={theme.text}>
              {summary}
            </Text>
          )}
          {link && (
            <Text style={{ color, fontSize: 14, fontWeight: '500', cursor: 'pointer' }} onClick={onClickLink}>
              <Trans>See here</Trans>
            </Text>
          )}
        </AutoColumn>
      </RowNoFlex>
    </Box>
  )
}
