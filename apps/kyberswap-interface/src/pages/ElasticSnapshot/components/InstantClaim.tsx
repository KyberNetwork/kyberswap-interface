import { Trans } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { useMedia } from 'react-use'

import { useActiveWeb3React } from 'hooks'
import { VerticalDivider } from 'pages/About/styleds'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

import avalanche from '../data/instant/avalanche.json'
import ethereum from '../data/instant/ethereum.json'
import optimism from '../data/instant/optimism.json'
import userPhase2 from '../data/instant/pendle_dappos_instant_polygon.json'
import userPhase2_5 from '../data/instant/phase2.5.json'
import polygon from '../data/instant/polygon.json'
import InstantClaimModal from './InstantClaimModal'

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })

export default function InstantClaim() {
  const [phase, setShow] = useState<'1' | '2' | '2.5' | null>(null)
  const { account } = useActiveWeb3React()

  const userData = useMemo(() => {
    if (!account) return []
    return [ethereum, optimism, polygon, avalanche].map(data =>
      data.find(info => info.claimData.receiver.toLowerCase() === account.toLowerCase()),
    )
  }, [account])

  const phase2Data = useMemo(() => {
    return userPhase2.find(info => info.claimData.receiver.toLowerCase() === account?.toLowerCase())
  }, [account])

  const phase2_5Data = useMemo(() => {
    return userPhase2_5.find(info => info.claimData.receiver.toLowerCase() === account?.toLowerCase())
  }, [account])

  const phase1Value = userData.reduce(
    (acc, cur) => acc + (cur?.claimData?.tokenInfo?.reduce((total, item) => total + item.value, 0) || 0),
    0,
  )
  const phase2Value = phase2Data?.claimData.tokenInfo.reduce((acc, cur) => acc + cur.value, 0) || 0
  const phase2_5Value = phase2_5Data?.claimData.tokenInfo.reduce((acc, cur) => acc + cur.value, 0) || 0

  const valuePhase2 = phase2_5Value || phase2Value

  const totalValue = phase1Value + phase2Value + phase2_5Value

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const onDismiss = useCallback(() => setShow(null), [])
  if (!userData.filter(Boolean).length && !phase2Data && !phase2_5Data) return null

  return (
    <div className="flex flex-col">
      {phase && <InstantClaimModal onDismiss={onDismiss} phase={phase} />}
      <span className="text-xl font-medium">
        <Trans>Available assets for claiming</Trans>
      </span>

      <div className={cn('mt-4 flex items-center', upToMedium ? 'px-0 py-3' : 'px-5 py-3')}>
        <div className={cn('flex w-max flex-col justify-between gap-4', upToMedium ? 'mr-3' : 'mr-6')}>
          <span className={cn('font-medium leading-5 text-subText', upToMedium ? 'text-xs' : 'text-sm')}>
            <Trans>TOTAL AMOUNT (USD)</Trans>
          </span>
          <span className={cn('font-medium', upToMedium ? 'text-base' : 'text-xl')}>{format(totalValue)}</span>
        </div>
        <VerticalDivider style={{ height: '100%' }} />

        <div className={cn('flex flex-col justify-between gap-4', upToMedium ? 'mx-3' : 'mx-6')}>
          <span className="text-sm leading-5 text-subText">
            <Trans>Phase 1</Trans>
          </span>
          <div className="flex items-end gap-4">
            <span className={cn('font-medium', upToMedium ? 'text-base' : 'text-xl')}>{format(phase1Value)}</span>
            {phase1Value !== 0 && (
              <span
                className="mb-0.5 cursor-pointer text-sm font-medium text-primary"
                role="button"
                onClick={() => {
                  setShow('1')
                }}
              >
                <Trans>Details</Trans>
              </span>
            )}
          </div>
        </div>

        <VerticalDivider style={{ height: '80%' }} />

        <div className={cn('flex flex-col justify-between gap-4', upToMedium ? 'mx-3' : 'mx-6')}>
          <span className="text-sm leading-5 text-subText">
            <Trans>Phase 2</Trans>
          </span>
          <div className="flex items-end gap-4">
            <span className={cn('font-medium', upToMedium ? 'text-base' : 'text-xl')}>{format(valuePhase2 || 0)}</span>
            {valuePhase2 !== 0 && (
              <span
                className="mb-0.5 cursor-pointer text-sm font-medium text-primary"
                role="button"
                onClick={() => {
                  setShow(phase2Data ? '2' : '2.5')
                }}
              >
                <Trans>Details</Trans>
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-normal text-subText">
        <Trans>Total Amount includes assets that KyberSwap has recovered or rescued under Category 3 & 5</Trans>
      </p>
      <p className="mt-2 text-sm leading-normal text-subText">
        <Trans>
          Your assets are spread across various networks. Kindly choose the relevant network and proceed with the
          claiming process.
        </Trans>
      </p>
    </div>
  )
}
