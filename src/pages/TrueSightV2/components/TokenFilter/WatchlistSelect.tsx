import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { CSSProperties } from 'styled-components'

import { SelectOption } from 'components/Select'
import { ActiveSelectItem, StyledSelect } from 'pages/TrueSightV2/components/TokenFilter'
import { ManageListModal } from 'pages/TrueSightV2/components/WatchlistButton'
import { useGetWatchlistInformationQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'

const WatchlistSelect = ({
  menuStyle,
  onChange,
  value,
}: {
  menuStyle: CSSProperties
  onChange: (key: string) => void
  value: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { data: dataWatchList } = useGetWatchlistInformationQuery()

  const watchlistesOptions = useMemo(() => {
    let total = 0
    const opts: SelectOption[] =
      dataWatchList?.watchlists?.map(e => {
        total += e.assetNumber
        return { value: e.id + '', label: `${e.name} (${e.assetNumber})` }
      }) || []

    opts.unshift({ label: t`All Tokens (${total})`, value: '' })
    opts.push({ label: t`Manage Lists`, onSelect: () => setIsOpen(true) }) // todo danh: update like desgin

    return opts
  }, [dataWatchList])

  return (
    <>
      <StyledSelect
        value={value}
        activeRender={item => <ActiveSelectItem name={t`Watchlist`} label={item?.label} />}
        options={watchlistesOptions}
        onChange={onChange}
        optionStyle={{ fontSize: '14px' }}
        menuStyle={menuStyle}
      />
      <ManageListModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  )
}
export default WatchlistSelect
