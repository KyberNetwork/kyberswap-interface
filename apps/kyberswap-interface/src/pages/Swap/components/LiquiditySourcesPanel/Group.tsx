import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useRef } from 'react'

import Checkbox from 'components/CheckBox'
import { HStack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { ImageWrapper, Source, SourceName } from 'pages/Swap/components/LiquiditySourcesPanel/components'
import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'

type Props = {
  tag: { id: number; name: string }
  debouncedSearchText: string
  chainId?: ChainId
}

export const LiquiditySourceGroup = ({ tag, debouncedSearchText, chainId: customChainId }: Props) => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const dexes = useAllDexes(chainId)

  const dexByTag = useMemo(() => dexes.filter(item => item.tags?.some(t => t.id === tag.id)), [dexes, tag.id])

  const [excludeDexes, setExcludeDexes] = useExcludeDexes(chainId)

  const handleToggleDex = (id: string) => {
    const isExclude = excludeDexes.find(item => item === id)
    if (isExclude) {
      setExcludeDexes(excludeDexes.filter(item => item !== id))
    } else {
      setExcludeDexes([...excludeDexes, id])
    }
  }

  const groupRef = useRef<HTMLInputElement>(null)
  const selectedDexes = dexByTag?.filter(item => !excludeDexes.includes(item.id)) || []
  const dexIds = dexByTag.map(item => item.id)

  useEffect(() => {
    if (!groupRef.current) return

    if (selectedDexes.length === dexByTag?.length) {
      groupRef.current.checked = true
      groupRef.current.indeterminate = false
    } else if (!selectedDexes.length) {
      groupRef.current.checked = false
      groupRef.current.indeterminate = false
    } else if (selectedDexes.length < (dexByTag?.length || 0)) {
      groupRef.current.checked = false
      groupRef.current.indeterminate = true
    }
  }, [dexByTag?.length, selectedDexes.length])

  const filteredDexes = dexByTag.filter(item => item.name.toLowerCase().includes(debouncedSearchText))
  const handleToggleGroup = (checked: boolean) => {
    if (checked) {
      setExcludeDexes(excludeDexes.filter(item => !dexIds.includes(item)))
    } else {
      setExcludeDexes([...excludeDexes.filter(item => !dexIds.includes(item)), ...dexIds])
    }
  }

  if (!filteredDexes.length) return null

  return (
    <>
      <Source onClick={() => handleToggleGroup(!groupRef.current?.checked)}>
        <HStack className="min-w-0 flex-1 items-center gap-3">
          <Checkbox
            ref={groupRef}
            checked={!dexIds.every(item => excludeDexes.includes(item))}
            onChange={e => handleToggleGroup(e.target.checked)}
            onClick={e => e.stopPropagation()}
          />
          <SourceName>{tag.name}</SourceName>
        </HStack>
        <span className="text-xs font-medium text-subText">
          {selectedDexes.length}/{dexByTag.length}
        </span>
      </Source>

      {filteredDexes.map(({ name, logoURL, id }) => {
        return (
          <Source key={name} className="pl-10" onClick={() => handleToggleDex(id)}>
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
        )
      })}
    </>
  )
}
