import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { ButtonHTMLAttributes, useEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'react-feather'

import IconButton from 'components/Button/IconButton'
import Checkbox from 'components/CheckBox'
import { HStack, Stack } from 'components/Stack'
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

export const BackIconWrapper: React.FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...rest }) => (
  <IconButton aria-label={t`Back`} className={className} {...rest}>
    <ChevronLeft size={24} className="text-subText" />
  </IconButton>
)

export const SourceList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <div
    {...rest}
    className={cn(
      'flex h-[280px] max-h-[280px] w-full flex-col gap-2 overflow-x-hidden overflow-y-scroll rounded-b-lg border border-t-0 border-border p-3',
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
      'flex items-center justify-between gap-4 rounded-t-lg border border-border bg-tableHeader p-3 text-xs font-medium uppercase text-subText',
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
  const selectedDexes = dexes?.filter(item => !excludeDexes.includes(item.id)) || []

  useEffect(() => {
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
  }, [dexes?.length, selectedDexes.length])

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
    <Stack className="w-full gap-4">
      <HStack className="items-center gap-1">
        <BackIconWrapper onClick={onBack} />
        <span className="text-lg font-medium text-text">{t`Liquidity Sources`}</span>
      </HStack>

      <Stack className="gap-3">
        <SearchBar value={searchText} onChange={setSearchText} />

        <Stack>
          <LiquiditySourceHeader>
            <HStack className="items-center gap-3">
              <Checkbox
                ref={checkAllRef}
                className="cursor-pointer"
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
            </HStack>
            <span className="text-subText">
              {selectedDexes.length}/{dexes?.length || 0}
            </span>
          </LiquiditySourceHeader>

          <SourceList>
            {Object.values(tagMap).map(tag => {
              return (
                <LiquiditySourceGroup
                  tag={tag}
                  debouncedSearchText={debouncedSearchText}
                  chainId={chainId}
                  key={tag.id}
                />
              )
            })}

            {dexes
              ?.filter(item => !item.tags && item.name.toLowerCase().includes(debouncedSearchText))
              .map(({ name, logoURL, id }) => (
                <Source key={id} onClick={() => handleToggleDex(id)}>
                  <Checkbox
                    checked={!excludeDexes.includes(id)}
                    onChange={() => handleToggleDex(id)}
                    onClick={e => e.stopPropagation()}
                  />

                  <ImageWrapper>
                    <img src={logoURL} alt="" />
                  </ImageWrapper>

                  <SourceName>{name}</SourceName>
                </Source>
              ))}
          </SourceList>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default LiquiditySourcesPanel
