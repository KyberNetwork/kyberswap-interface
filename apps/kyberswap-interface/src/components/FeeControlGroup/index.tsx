import { Trans } from '@lingui/macro'
import { useSearchParams } from 'react-router-dom'

import CustomFeeInput from 'components/FeeControlGroup/CustomFeeInput'
import useGetFeeConfig from 'components/SwapForm/hooks/useGetFeeConfig'
import { ClientNameMapping, DEFAULT_TIPS } from 'constants/index'
import { cn } from 'utils/cn'

const feeOptionClasses =
  'h-full rounded-[20px] border border-transparent bg-tabBackground p-0 text-center text-xs font-normal leading-4 text-subText outline-none cursor-pointer hover:border-bg4 focus:border-bg4 data-[active=true]:border-primary data-[active=true]:bg-tabActive data-[active=true]:font-medium data-[active=true]:text-text'

const FeeControlGroup = () => {
  const { feeAmount, enableTip, clientId, clientName } = useGetFeeConfig() ?? {}
  const [searchParams, setSearchParams] = useSearchParams()
  const feeValue = Number.parseFloat(feeAmount ?? '0')

  const handleFeeChange = (next: number) => {
    if (enableTip) {
      searchParams.set('feeAmount', next.toString())
      setSearchParams(searchParams)
    }
  }

  if (!enableTip) {
    return null
  }

  const tipRecipientName = clientName || ClientNameMapping[clientId || ''] || clientId || 'the creator'

  return (
    <div className="flex w-full flex-col px-2">
      <p className="text-xs font-medium text-subText">
        <Trans>Tip</Trans>:
      </p>
      <p className="text-xs font-medium text-subText">
        <Trans>
          No hidden fees - Your optional tips support <span className="text-text">{tipRecipientName}</span>!
        </Trans>
      </p>

      <div className="mt-2 flex h-7 w-full max-w-full justify-between rounded-[20px] bg-tabBackground p-0.5">
        {DEFAULT_TIPS.map(tip => (
          <button
            key={tip}
            onClick={() => handleFeeChange(tip)}
            data-active={tip === feeValue}
            className={cn(feeOptionClasses, 'basis-[18%] max-[375px]:basis-[15%] max-[375px]:text-[10px]')}
          >
            {tip ? `${tip / 100}%` : <Trans>No tip</Trans>}
          </button>
        ))}
        <CustomFeeInput fee={feeValue} onFeeChange={handleFeeChange} />
      </div>
    </div>
  )
}

export default FeeControlGroup
