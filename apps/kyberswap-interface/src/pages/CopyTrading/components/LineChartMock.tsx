import { useState } from 'react'

import { HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

const chartRanges = ['7D', '1M', '3M', 'All'] as const

const LineChartMock = () => {
  const [range, setRange] = useState<(typeof chartRanges)[number]>('1M')

  return (
    <Stack className="gap-9 rounded-xl bg-buttonBlack p-6">
      <Stack className="gap-5">
        <HStack className="flex-wrap items-center justify-between gap-4">
          <h2 className="m-0 text-lg font-semibold text-text">Cumulative Realised P&L</h2>
          <HStack className="rounded-full bg-background p-1 text-xs text-subText">
            {chartRanges.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={cn(
                  'h-6 min-w-9 cursor-pointer rounded-full border-0 bg-transparent px-2 text-xs text-subText transition-colors hover:text-text',
                  range === item && 'bg-subText-20 text-text',
                )}
              >
                {item}
              </button>
            ))}
          </HStack>
        </HStack>
        <div className="relative h-72 overflow-hidden">
          <div className="absolute inset-0 grid grid-rows-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border-b border-border" />
            ))}
          </div>
          <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 900 270">
            <path
              d="M40 132 C75 85 100 118 122 96 C144 72 144 62 166 91 C185 118 220 80 245 112 C270 144 270 142 300 145 C326 148 330 190 354 186 C380 182 370 224 400 215 C430 206 420 176 455 190 C485 202 500 154 532 128 C565 100 590 94 616 114 C640 134 650 72 675 88 C698 104 712 112 740 116 C770 120 770 152 804 150 C830 148 826 200 858 205"
              fill="none"
              stroke="var(--ks-primary)"
              strokeWidth="4"
            />
            <path
              d="M300 145 C326 148 330 190 354 186 C380 182 370 224 400 215 C430 206 420 176 455 190"
              fill="none"
              stroke="var(--ks-red)"
              strokeWidth="4"
            />
            <path
              d="M740 116 C770 120 770 152 804 150 C830 148 826 200 858 205"
              fill="none"
              stroke="var(--ks-red)"
              strokeWidth="4"
            />
          </svg>
          <div className="absolute left-2/3 top-8 h-56 border-l border-dashed border-subText max-md:hidden" />
          <Stack className="absolute left-2/3 top-8 rounded-lg bg-background px-4 py-3 text-xs shadow-lg max-md:hidden">
            <span className="text-subText">Nov 23, 2026, 13:00</span>
            <HStack className="mt-2 gap-2">
              <span className="text-subText">P&L</span>
              <span className="font-medium text-primary">+ $1,256 (+26.5%)</span>
            </HStack>
          </Stack>
        </div>
      </Stack>

      <Stack className="gap-5">
        <h2 className="m-0 text-lg font-semibold text-text">Capital Value</h2>
        <div className="relative h-64">
          <div className="absolute inset-0 grid grid-rows-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border-b border-border" />
            ))}
          </div>
          <HStack className="absolute inset-x-0 bottom-0 h-48 items-end justify-between px-3">
            {[58, 90, 114, 99, 96, 116, 108].map((height, index) => (
              <Stack key={index} className="w-10 items-center gap-2.5">
                <div className={cn('w-full rounded-t bg-blue/40', index === 2 && 'bg-blue')} style={{ height }} />
                <span className="text-xs text-subText">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][index]}</span>
              </Stack>
            ))}
          </HStack>
        </div>
      </Stack>
    </Stack>
  )
}

export default LineChartMock
