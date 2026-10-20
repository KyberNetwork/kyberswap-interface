import { ReactNode } from 'react'

import { Center, Stack } from 'components/Stack'
import ReverseTokenSelectionButton from 'components/SwapForm/ReverseTokenSelectionButton'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { cn } from 'utils/cn'

type Props = {
  hidden?: boolean
  networkSelector?: ReactNode
  inputPanel: ReactNode
  outputPanel: ReactNode
  tokenInfo?: ReactNode
  recipient?: ReactNode
  details: ReactNode
  action: ReactNode
  onReverse: () => void
}

export const SwapFormLayout = ({
  hidden,
  networkSelector,
  inputPanel,
  outputPanel,
  tokenInfo,
  recipient,
  details,
  action,
  onReverse,
}: Props) => (
  <Stack className={cn('gap-4', hidden && 'hidden')}>
    <Stack id={TutorialIds.SWAP_FORM_CONTENT} className="relative z-[1] gap-3 bg-background">
      {networkSelector}
      <Stack className="gap-3">
        <div className="relative">
          {inputPanel}
          <Center className="pointer-events-none absolute inset-x-0 -bottom-5 z-20">
            <ReverseTokenSelectionButton className="pointer-events-auto" onClick={onReverse} />
          </Center>
        </div>
        {outputPanel}
      </Stack>
      {tokenInfo}
      {recipient}
    </Stack>
    {details}
    {action}
  </Stack>
)
