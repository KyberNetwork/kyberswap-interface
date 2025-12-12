import { Trash2 } from 'react-feather'

import { ReactComponent as PinIcon } from 'assets/svg/pin_icon.svg'
import { ReactComponent as PinSolidIcon } from 'assets/svg/pin_solid_icon.svg'
import { ItemActionButton, ItemActionWrapper, PinnedBadge } from 'components/Announcement/PrivateAnnoucement/styled'

type Props = {
  isPinned?: boolean
  onPin?: () => void
  onDelete?: () => void
}

export default function InboxActions({ isPinned, onPin, onDelete }: Props) {
  const hasActions = Boolean(onPin || onDelete)

  if (!hasActions && !isPinned) return null

  return (
    <>
      {isPinned ? (
        <PinnedBadge>
          <PinSolidIcon />
        </PinnedBadge>
      ) : null}

      {hasActions ? (
        <ItemActionWrapper>
          {onPin ? (
            <ItemActionButton
              aria-label={isPinned ? 'Unpin notification' : 'Pin notification'}
              $active={isPinned}
              onClick={e => {
                e.stopPropagation()
                onPin()
              }}
            >
              {isPinned ? <PinSolidIcon /> : <PinIcon />}
            </ItemActionButton>
          ) : null}
          {onDelete ? (
            <ItemActionButton
              aria-label="Delete notification"
              onClick={e => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 />
            </ItemActionButton>
          ) : null}
        </ItemActionWrapper>
      ) : null}
    </>
  )
}
