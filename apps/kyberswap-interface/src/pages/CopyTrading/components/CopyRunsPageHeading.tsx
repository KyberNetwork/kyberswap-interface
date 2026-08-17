import { Link } from 'react-router-dom'

import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { cn } from 'utils/cn'

type CopyRunsView = 'open' | 'history'

type CopyRunsPageHeadingProps = {
  activeView: CopyRunsView
}

const copyRunsTabs: Array<{
  description: string
  label: string
  to: string
  value: CopyRunsView
}> = [
  {
    description: 'Monitor and manage all your active copy positions.',
    label: 'Open Copies',
    to: `${APP_PATHS.COPY_TRADING}/my-copies`,
    value: 'open',
  },
  {
    description: 'Review all closed copy runs and settled performance.',
    label: 'History',
    to: `${APP_PATHS.COPY_TRADING}/history`,
    value: 'history',
  },
]

const CopyRunsPageHeading = ({ activeView }: CopyRunsPageHeadingProps) => {
  const activeTab = copyRunsTabs.find(tab => tab.value === activeView) || copyRunsTabs[0]

  return (
    <Stack className="gap-2">
      <h1 className="sr-only">{activeTab.label}</h1>
      <div className="flex items-center gap-3 overflow-x-auto" role="tablist" aria-label="Copy runs">
        {copyRunsTabs.map((tab, index) => {
          const active = tab.value === activeView

          return (
            <div key={tab.value} className="flex shrink-0 items-center gap-3">
              {!!index && <span aria-hidden className="h-6 border border-subText-40" />}
              <Link
                aria-selected={active}
                className={cn(
                  'text-2xl font-medium no-underline',
                  active ? 'text-primary' : 'text-subText hover:text-text',
                )}
                role="tab"
                to={tab.to}
              >
                {tab.label}
              </Link>
            </div>
          )
        })}
      </div>
      <p className="text-base text-subText">{activeTab.description}</p>
    </Stack>
  )
}

export default CopyRunsPageHeading
