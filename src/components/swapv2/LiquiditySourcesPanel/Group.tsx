import { useEffect, useMemo, useRef } from 'react'

import Checkbox from 'components/CheckBox'
import { useActiveWeb3React } from 'hooks'
import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'

import { ImageWrapper, Source, SourceName } from './styles'

export const LiquiditySourceGroup = ({
  tag,
  debouncedSearchText,
}: {
  tag: { id: number; name: string }
  debouncedSearchText: string
}) => {
  const { chainId } = useActiveWeb3React()
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

  useEffect(() => {
    const selectedDexes = dexByTag?.filter(item => !excludeDexes.includes(item.id)) || []

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
  }, [excludeDexes, dexByTag])

  const filteredDexes = dexByTag.filter(item => item.name.toLowerCase().includes(debouncedSearchText))

  if (!filteredDexes.length) return null

  return (
    <>
      <Source>
        <Checkbox
          ref={groupRef}
          checked={!dexByTag.map(i => i.id).every(item => excludeDexes.includes(item))}
          onChange={e => {
            if (e.target.checked) {
              setExcludeDexes(excludeDexes.filter(item => !dexByTag.map(d => d.id).includes(item)))
            } else {
              const newData = [
                ...excludeDexes.filter(item => dexByTag.map(d => d.id).includes(item)),
                ...dexByTag.map(item => item.id),
              ]
              setExcludeDexes(newData)
            }
          }}
        />
        <SourceName>{tag.name}</SourceName>
      </Source>

      {filteredDexes.map(({ name, logoURL, id }) => {
        return (
          <Source key={name} style={{ padding: '12px 48px' }}>
            <Checkbox checked={!excludeDexes.includes(id)} onChange={() => handleToggleDex(id)} />

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
