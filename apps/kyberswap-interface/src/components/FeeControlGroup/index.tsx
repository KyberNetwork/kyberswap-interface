import { Trans } from '@lingui/macro'
import { useSearchParams } from 'react-router-dom'

import CustomFeeInput from 'components/FeeControlGroup/CustomFeeInput'
import useGetFeeConfig from 'components/SwapForm/hooks/useGetFeeConfig'
import { ClientNameMapping, DEFAULT_TIPS } from 'constants/index'
import { cn } from 'utils/cn'
import getShortenAddress from 'utils/getShortenAddress'

const feeOptionClasses =
  'h-full rounded-[20px] border border-transparent bg-tabBackground p-0 text-center text-xs font-normal leading-4 text-subText outline-none cursor-pointer hover:border-bg4 focus:border-bg4 data-[active=true]:border-primary data-[active=true]:bg-tabActive data-[active=true]:font-medium data-[active=true]:text-text'

const FeeControlGroup = () => {
  const { feeAmount, enableTip, clientId, clientName, feeReceiver } = useGetFeeConfig() ?? {}
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

  const configuredClientName = clientName && clientName !== clientId ? clientName : ''
  const tipRecipientName =
    configuredClientName || ClientNameMapping[clientId || ''] || getShortenAddress(feeReceiver || '')

  return (
    <div className="flex w-full flex-col rounded-lg bg-white-04 p-3">
      <p className="flex min-w-0 items-center text-xs font-medium text-subText">
        <span className="shrink-0">
          <Trans>
            No hidden fees! Your <span className="text-text/80">optional tips</span> support
          </Trans>
          &nbsp;
        </span>
        <span className="min-w-0 truncate text-text/80">{tipRecipientName}</span>
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
