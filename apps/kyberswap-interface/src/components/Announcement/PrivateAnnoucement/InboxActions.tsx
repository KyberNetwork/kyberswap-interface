import { Trash2 } from 'react-feather'

import { ReactComponent as PinIcon } from 'assets/svg/ic_pin.svg'
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
          <PinIcon aria-hidden="true" />
        </PinnedBadge>
      ) : null}

      {hasActions ? (
        <ItemActionWrapper>
          {onPin ? (
            <ItemActionButton
              aria-label={isPinned ? 'Unpin notification' : 'Pin notification'}
              aria-pressed={Boolean(isPinned)}
              $active={isPinned}
              onClick={e => {
                e.stopPropagation()
                onPin()
              }}
            >
              <PinIcon aria-hidden="true" />
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
