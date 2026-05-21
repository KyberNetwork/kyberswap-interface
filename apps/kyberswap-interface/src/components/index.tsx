import { Text, TextProps } from 'rebass'

import { cn } from 'utils/cn'

export const TruncatedText = ({ className, ...props }: TextProps) => (
  <Text {...props} className={cn('truncate', className)} />
)
