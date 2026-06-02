import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'react-feather'

import Checkbox from 'components/CheckBox'
import { LiquiditySourceGroup } from 'components/swapv2/LiquiditySourcesPanel/Group'
import SearchBar from 'components/swapv2/LiquiditySourcesPanel/SearchBar'
import { ImageWrapper, Source, SourceName } from 'components/swapv2/LiquiditySourcesPanel/styles'
import useDebounce from 'hooks/useDebounce'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'
import { cn } from 'utils/cn'

type Props = {
  onBack: () => void
  chainId?: ChainId
}

export const BackIconWrapper: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <ArrowLeft {...rest} className={cn('mr-[10px] size-5 cursor-pointer [&_path]:!stroke-text', className)} />
)

export const SourceList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <div
    {...rest}
    className={cn(
      'flex h-[300px] max-h-[300px] w-full flex-col gap-y-6 overflow-x-hidden overflow-y-scroll',
      '[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:rounded-[999px]',
      '[&::-webkit-scrollbar-track]:rounded-[999px] [&::-webkit-scrollbar-track]:bg-transparent',
      '[&::-webkit-scrollbar-thumb]:rounded-[999px] [&::-webkit-scrollbar-thumb]:bg-disableText',
      className,
    )}
  >
    {children}
  </div>
)

export const LiquiditySourceHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    {...rest}
    className={cn(
      'flex items-center gap-4 rounded-t-lg bg-tableHeader p-3 text-xs font-medium uppercase text-subText',
      className,
    )}
  >
    {children}
  </div>
)

const LiquiditySourcesPanel: React.FC<Props> = ({ onBack, chainId }) => {
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.toLowerCase(), 200).trim()

  const dexes = useAllDexes(chainId)
  const [excludeDexes, setExcludeDexes] = useExcludeDexes(chainId)
  const { trackingHandler } = useTracking()

  const tagMap: { [key: number]: { name: string; id: number; logoURL: string } } = {}
  dexes?.forEach(item => {
    item.tags?.forEach(tag => {
      tagMap[tag.id] = tag
    })
  })

  const checkAllRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const selectedDexes = dexes?.filter(item => !excludeDexes.includes(item.id)) || []

    if (!checkAllRef.current) return

    if (selectedDexes.length === dexes?.length) {
      checkAllRef.current.checked = true
      checkAllRef.current.indeterminate = false
    } else if (!selectedDexes.length) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = false
    } else if (selectedDexes.length < (dexes?.length || 0)) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = true
    }
  }, [excludeDexes, dexes])

  const handleToggleDex = (id: string) => {
    const isExclude = excludeDexes.find(item => item === id)
    const dex = dexes?.find(item => item.id === id)
    if (isExclude) {
      setExcludeDexes(excludeDexes.filter(item => item !== id))
    } else {
      setExcludeDexes([...excludeDexes, id])
    }
    trackingHandler(TRACKING_EVENT_TYPE.LIQUIDITY_SOURCES_TOGGLED, {
      source_name: dex?.name || id,
      enabled: !!isExclude,
      total_enabled: (dexes?.length || 0) - (isExclude ? excludeDexes.length - 1 : excludeDexes.length + 1),
      total_available: dexes?.length || 0,
    })
  }

  return (
    <div className="w-full">
      <div className="flex w-full flex-col gap-y-5">
        <div className="mt-[5px] flex items-center">
          <BackIconWrapper onClick={onBack} />
          <span className="text-lg font-medium text-text">{t`Liquidity Sources`}</span>
        </div>

        <SearchBar text={searchText} setText={setSearchText} />

        <LiquiditySourceHeader>
          <Checkbox
            ref={checkAllRef}
            onChange={e => {
              if (!e.currentTarget.checked) {
                setExcludeDexes(dexes?.map(item => item.id) || [])
              } else {
                setExcludeDexes([])
              }
            }}
          />
          <span>
            <Trans>Liquidity Sources</Trans>
          </span>
        </LiquiditySourceHeader>

        <SourceList>
          {Object.values(tagMap).map(tag => {
            return <LiquiditySourceGroup tag={tag} debouncedSearchText={debouncedSearchText} key={tag.id} />
          })}

          {dexes
            ?.filter(item => !item.tags && item.name.toLowerCase().includes(debouncedSearchText))
            .map(({ name, logoURL, id }) => (
              <Source key={id}>
                <Checkbox checked={!excludeDexes.includes(id)} onChange={() => handleToggleDex(id)} />

                <ImageWrapper>
                  <img src={logoURL} alt="" />
                </ImageWrapper>

                <SourceName>{name}</SourceName>
              </Source>
            ))}
        </SourceList>
      </div>
    </div>
  )
}

export default LiquiditySourcesPanel
