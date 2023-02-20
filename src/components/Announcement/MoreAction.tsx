import { Trans } from '@lingui/macro'
import { MoreHorizontal, Trash } from 'react-feather'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import MailIcon from 'components/Icons/MailIcon'
import MenuFlyout_V2 from 'components/MenuFlyout/MenuFlyoutV2'
import useNotification from 'hooks/useNotification'

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`
const customStyle = css`
  padding: 16px;
`
const MenuMoreAction = ({ showClearAll, clearAll }: { clearAll: () => void; showClearAll: boolean }) => {
  const { showNotificationModal } = useNotification()
  return (
    <MenuFlyout_V2 modalWhenMobile={false} trigger={<MoreHorizontal cursor="pointer" />} customStyle={customStyle}>
      <Column gap="16px">
        <MenuItem onClick={showNotificationModal}>
          <MailIcon size={16} />
          Notification Center
        </MenuItem>
        {showClearAll && (
          <MenuItem>
            <Trash size={16} />
            <Trans>Clear All</Trans>
          </MenuItem>
        )}
      </Column>
    </MenuFlyout_V2>
  )
}
export default MenuMoreAction
