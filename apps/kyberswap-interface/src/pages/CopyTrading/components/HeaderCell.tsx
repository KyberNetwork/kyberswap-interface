import { ChevronDown } from 'react-feather'

import { HStack } from 'components/Stack'
import { cn } from 'utils/cn'

export const HeaderCell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <HStack className={cn('items-center gap-1 px-3 py-2 text-xs font-semibold uppercase text-subText', className)}>
    {children}
    <ChevronDown size={12} className="shrink-0" />
  </HStack>
)
