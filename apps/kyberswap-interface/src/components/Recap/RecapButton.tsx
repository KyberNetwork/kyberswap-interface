import { useMedia } from 'react-use'

import { ReactComponent as RecapIcon } from 'assets/recap/2025.svg'
import { isRecapAvailable } from 'components/Recap/utils'
import { useRecapModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

export default function RecapButton() {
  const toggleRecapModal = useRecapModalToggle()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upTo1515 = useMedia('(max-width: 1515px)')
  const upTo820 = useMedia('(max-width: 820px)')

  if (!isRecapAvailable()) return null

  const btnText = !upTo1515 ? (
    '✨ 2025 Journey ✨'
  ) : !upToLarge ? (
    <RecapIcon width={36} height={36} />
  ) : !upTo820 ? (
    '✨ 2025 Journey ✨'
  ) : (
    <RecapIcon width={36} height={36} />
  )

  // Original CSS layering (specificity-ordered):
  // base: padding 10px 16px / border-radius 20px
  // max-1515px: padding 2px / border-radius 50%
  // upToLarge (1200): padding 10px 16px / border-radius 20px (wins over 1515px when both apply)
  // max-820px: padding 2px / border-radius 50% (wins over upToLarge)
  // Compute the effective shape from JS state so the cascade is explicit.
  const showIconShape = (upTo1515 && !upToLarge) || upTo820

  return (
    <button
      onClick={toggleRecapModal}
      className={cn(
        'flex cursor-pointer items-center justify-center whitespace-nowrap border-none bg-primary-20 text-sm font-medium leading-5 text-primary transition-colors duration-200 ease-out hover:bg-primary-25',
        showIconShape ? 'rounded-full p-0.5' : 'rounded-[20px] px-4 py-2.5',
      )}
    >
      {btnText}
    </button>
  )
}
