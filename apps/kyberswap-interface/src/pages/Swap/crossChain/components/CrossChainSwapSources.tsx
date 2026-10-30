import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'

import CheckBox from 'components/CheckBox'
import { HStack, Stack } from 'components/Stack'
import { SearchBar } from 'components/SwapForm/Settings/LiquiditySourcesPanel/SearchBar'
import {
  BackIconWrapper,
  ImageWrapper,
  LiquiditySourceHeader,
  Source,
  SourceList,
  SourceName,
} from 'components/SwapForm/Settings/LiquiditySourcesPanel/components'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { CrossChainSwapFactory } from 'pages/Swap/crossChain/factory'
import { type CrossChainQuoteMode, updateExcludedSources, updateKyberCrossExcludedSources } from 'state/crossChainSwap'
import { useAppDispatch, useAppSelector } from 'state/hooks'

const EMPTY_SOURCES: string[] = []

type Props = {
  onBack?: () => void
  quoteMode?: CrossChainQuoteMode
}

const CrossChainSwapSources = ({ onBack, quoteMode: mode }: Props) => {
  const { trackingHandler } = useTracking()
  const [searchText, setSearchText] = useState('')

  const checkAllRef = useRef<HTMLInputElement | null>(null)

  const quoteMode = mode ?? 'stream'
  const sources = useMemo(() => CrossChainSwapFactory.getSelectableSources(quoteMode), [quoteMode])
  const sourceNames = useMemo(() => sources.map(item => item.getName()), [sources])
  const storedExcludedSources = useAppSelector(
    state =>
      (quoteMode === 'direct'
        ? state.crossChainSwap.kyberCrossExcludedSources
        : state.crossChainSwap.excludedSources) || EMPTY_SOURCES,
  )
  const excludedSources = useMemo(
    () => storedExcludedSources.filter(source => sourceNames.includes(source)),
    [sourceNames, storedExcludedSources],
  )
  const selectedSources = sources?.filter(item => !excludedSources.includes(item.getName())) || []
  const dispatch = useAppDispatch()
  const updateSources = quoteMode === 'direct' ? updateKyberCrossExcludedSources : updateExcludedSources

  const handleToggleSource = (sourceName: string) => {
    const isExclude = excludedSources.find(i => i === sourceName)
    const enabled = !!isExclude
    const nextExcludedSources = isExclude
      ? excludedSources.filter(ex => ex !== sourceName)
      : [...excludedSources, sourceName]

    dispatch(updateSources(nextExcludedSources))

    trackingHandler(TRACKING_EVENT_TYPE.CC_ROUTING_SOURCE_TOGGLED, {
      source_name: sourceName,
      enabled,
      total_enabled: sources.length - nextExcludedSources.length,
      total_available: sources.length,
    })
  }
  useEffect(() => {
    if (!checkAllRef.current) return
    if (selectedSources.length === sources.length) {
      checkAllRef.current.checked = true
      checkAllRef.current.indeterminate = false
    } else if (!selectedSources.length) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = false
    } else if (selectedSources.length < sources.length) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = true
    }
  }, [selectedSources.length, sources.length])

  return (
    <Stack className="w-full gap-4">
      <HStack className="items-center gap-1">
        <BackIconWrapper onClick={onBack} />
        <span className="text-lg font-medium text-text">
          <Trans>Liquidity Sources</Trans>
        </span>
      </HStack>

      <Stack className="gap-3">
        <SearchBar value={searchText} onChange={setSearchText} />

        <Stack>
          <LiquiditySourceHeader>
            <HStack className="items-center gap-3">
              <CheckBox
                ref={checkAllRef}
                className="cursor-pointer"
                onChange={e => {
                  if (!e.currentTarget.checked) {
                    dispatch(updateSources(sources.map(item => item.getName())))
                  } else {
                    dispatch(updateSources([]))
                  }
                }}
              />
              <span>
                <Trans>Liquidity Sources</Trans>
              </span>
            </HStack>
            <span className="text-subText">
              {selectedSources.length}/{sources.length}
            </span>
          </LiquiditySourceHeader>

          <SourceList>
            {sources
              ?.filter(item => item.getName().toLowerCase().includes(searchText.toLowerCase().trim()))
              .map(item => (
                <Source key={item.getName()} onClick={() => handleToggleSource(item.getName())}>
                  <CheckBox
                    checked={!excludedSources.includes(item.getName())}
                    onChange={() => handleToggleSource(item.getName())}
                    onClick={e => e.stopPropagation()}
                  />

                  {item.getIcon && (
                    <ImageWrapper>
                      <img src={item.getIcon()} alt="" />
                    </ImageWrapper>
                  )}

                  <SourceName>{item.getName()}</SourceName>
                </Source>
              ))}
          </SourceList>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default CrossChainSwapSources
