import { useMedia } from 'react-use'

import Icon from 'pages/Earns/Landing/Icon'
import { BorderWrapper, ButtonPrimaryStyled, CardWrapper } from 'pages/Earns/Landing/styles'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

const Card = ({
  title,
  icon,
  desc,
  action,
}: {
  title: string
  icon: string
  desc: string
  action: { text: string; disabled?: boolean; onClick: () => void }
}) => {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <BorderWrapper onClick={() => !action.disabled && action.onClick()}>
      <CardWrapper>
        <div className={cn('flex flex-col items-center', upToSmall ? 'min-w-[unset]' : 'w-20')}>
          {!upToSmall && <div className="h-9 w-px bg-[#258166]" />}
          <Icon icon={icon} size={upToSmall ? 'small' : 'medium'} customSize={upToSmall ? 48 : undefined} />
        </div>

        <div className="flex h-full flex-col justify-between">
          {/* sm:mb-6 guarantees a gap between the description and the bottom-pinned button — only visible on
              the tallest card (whose text nearly fills the equal-height card); on mobile the button's own
              mt-5 handles spacing. */}
          <div className="sm:mb-6">
            <p className={cn('text-lg font-medium', upToSmall ? 'mt-0' : 'mt-7')}>{title}</p>
            <p className={cn('mt-3 text-subText', upToMedium ? 'text-sm' : 'text-base')}>{desc}</p>
          </div>
          {(!upToSmall || !action.disabled) && (
            <ButtonPrimaryStyled disabled={action.disabled}>{action.text}</ButtonPrimaryStyled>
          )}
        </div>
      </CardWrapper>
    </BorderWrapper>
  )
}

export default Card
