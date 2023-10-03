import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import styled, { CSSProperties } from 'styled-components'

import Icon from 'components/Icons/Icon'
import Row from 'components/Row'
import { SelectOption } from 'components/Select'
import { ActiveSelectItem, StyledSelect } from 'pages/TrueSightV2/components/TokenFilter'
import { ManageListModal } from 'pages/TrueSightV2/components/WatchlistButton'
import { useGetWatchlistInformationQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'

const Divider = styled.div`
  height: 1px;
  margin: 6px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const CustomOption = styled(Row)`
  :hover {
    background-color: ${({ theme }) => theme.background};
  }
`

const optionStyle: CSSProperties = { fontSize: '14px', padding: '10px 18px', alignItems: 'center' }
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

  const { options, totalToken } = useMemo(() => {
    let totalToken = 0
    const opts: SelectOption[] =
      dataWatchList?.watchlists?.map(e => {
        totalToken += e.assetNumber
        return { value: e.id + '', label: `${e.name} (${e.assetNumber})` }
      }) || []
    return { options: opts, totalToken }
  }, [dataWatchList])

  const labelAll = <Trans>All Tokens ({totalToken})</Trans>

  return (
    <>
      <StyledSelect
        value={value}
        activeRender={item => <ActiveSelectItem name={t`Watchlist`} label={value ? item?.label : labelAll} />}
        options={options}
        onChange={onChange}
        dropdownRender={menu => {
          return (
            <>
              <CustomOption style={optionStyle} onClick={() => onChange('')}>
                {labelAll}
              </CustomOption>
              <Divider />
              {menu}
              <Divider />
              <CustomOption style={optionStyle} gap="6px" onClick={() => setIsOpen(true)}>
                <Icon id="assignment" size={20} /> <Trans>Manage Lists</Trans>
              </CustomOption>
            </>
          )
        }}
        optionStyle={optionStyle}
        menuStyle={menuStyle}
      />
      <ManageListModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  )
}
export default WatchlistSelect
