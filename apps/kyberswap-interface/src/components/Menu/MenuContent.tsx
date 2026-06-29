import type { ReactNode } from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronDown, X } from 'react-feather'

import { ButtonEmpty } from 'components/Button'
import { useMenuScrollIndicator } from 'components/Menu/hooks/useMenuScrollIndicator'
import { Stack } from 'components/Stack'
import { TAG } from 'constants/env'
import { cn } from 'utils/cn'

type MenuContentProps = {
  children?: ReactNode
  toggle?: () => void
}

const MenuContent = ({ children, toggle }: MenuContentProps) => {
  const { setScrollContainerNode, showScroll } = useMenuScrollIndicator()

  return (
    <Stack ref={setScrollContainerNode} className="relative max-h-[calc(100vh-150px)] overflow-y-scroll">
      {isMobile && (
        <ButtonEmpty onClick={toggle} className="absolute right-0 top-0 w-fit p-0">
          <X className="text-subText" />
        </ButtonEmpty>
      )}

      {children}

      <Stack className="px-5 pb-2 pt-3">
        <span className="block text-center text-[10px] font-light text-subText">kyberswap@{TAG}</span>
      </Stack>
      <div
        className={cn(
          'sticky z-[2] w-full text-center [animation:floating_1s_ease_infinite_alternate-reverse]',
          showScroll ? 'visible' : 'invisible',
        )}
      >
        <ChevronDown className="text-text4" />
      </div>
    </Stack>
  )
}

export default MenuContent
