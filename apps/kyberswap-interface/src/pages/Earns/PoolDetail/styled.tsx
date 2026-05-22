import { PoolPageWrapper } from 'pages/Earns/PoolExplorer/styles'
import { cn } from 'utils/cn'

export type NoteCardTone = 'info' | 'warning' | 'error'

export const PoolDetailWrapper = ({ children, className, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <PoolPageWrapper
    className={cn('mx-auto w-full px-6 pb-[68px] pt-8 max-sm:px-4 max-sm:pb-[100px] max-sm:pt-6', className)}
    // gap is applied inline so it overrides PoolPageWrapper's styled-components `gap: 16px` —
    // styled-components style tags are injected after Tailwind CSS so class-based overrides lose.
    style={{ gap: '24px', ...style }}
    {...rest}
  >
    {children}
  </PoolPageWrapper>
)

export const NoteCard = ({
  children,
  className,
  $warning,
  $tone,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { $warning?: boolean; $tone?: NoteCardTone }) => {
  const tone = $tone || ($warning ? 'warning' : 'info')
  const bgClass = tone === 'error' ? 'bg-red-20' : tone === 'warning' ? 'bg-warning-20' : 'bg-primary-20'
  return (
    <div className={cn('rounded-xl px-3 py-2 text-sm text-white', bgClass, className)} {...rest}>
      {children}
    </div>
  )
}
