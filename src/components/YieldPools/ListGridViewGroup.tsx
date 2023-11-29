import { ReactNode } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as GridViewIcon } from 'assets/svg/grid_view.svg'
import { ReactComponent as ListViewIcon } from 'assets/svg/list_view.svg'
import { useViewMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'

const defaultIcons: { [mode in VIEW_MODE]: ReactNode } = {
  [VIEW_MODE.LIST]: <ListViewIcon />,
  [VIEW_MODE.GRID]: <GridViewIcon />,
}

const Wrapper = styled(Flex)(({ theme }) => ({
  border: `1px solid ${theme.border}`,
  borderRadius: '999px',
  width: 'fit-content',
  padding: '2px',
  alignItems: 'center',
}))

const Item = styled.button<{ active: boolean }>(({ theme, active }) => ({
  all: 'unset',
  color: active ? theme.primary : theme.subText,
  background: active ? theme.tabActive : 'transparent',
  borderRadius: '999px',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',

  '> svg': {
    width: '16px',
    height: '16px',
  },
}))

export default function ListGridViewGroup({ customIcons }: { customIcons?: { [mode in VIEW_MODE]?: ReactNode } }) {
  const [viewMode, setViewMode] = useViewMode()

  return (
    <Wrapper>
      {[VIEW_MODE.LIST, VIEW_MODE.GRID].map(mode => (
        <Item active={viewMode === mode} onClick={() => setViewMode(mode)} key={mode}>
          {customIcons?.[mode] || defaultIcons[mode]}
        </Item>
      ))}
    </Wrapper>
  )
}
