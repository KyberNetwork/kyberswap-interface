import styled, { CSSProperties, css } from 'styled-components'

import Row from 'components/Row'

const ListTab = styled.div`
  display: flex;
  width: 100%;
  gap: 2px;
  align-items: center;
  justify-content: space-between;
  padding: 3px;
  overflow-x: auto;
`

const TabWrapper = styled(Row)`
  position: relative;

  width: 100%;
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px;
  justify-content: center;

  overflow: hidden;
`

const TabItem = styled.div<{ active: boolean }>`
  width: 100%;
  padding: 6px;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  color: ${({ theme }) => theme.subText};
  border-radius: 20px;
  :hover {
    color: ${({ theme }) => theme.text};
    background-color: ${({ theme }) => theme.tabActive};
  }
  ${({ active }) =>
    active &&
    css`
      color: ${({ theme }) => theme.text};
      background-color: ${({ theme }) => theme.border} !important;
    `}
`

interface TabProps<T extends string | number> {
  activeTab: T
  setActiveTab: React.Dispatch<React.SetStateAction<T>>
  tabs: readonly { readonly title: string; readonly value: T }[]
  style?: CSSProperties
}

export default function Tabs<T extends string | number>({ activeTab, setActiveTab, tabs, style }: TabProps<T>) {
  return (
    <TabWrapper style={style}>
      <ListTab>
        {tabs.map(tab => (
          <TabItem key={tab.title} active={activeTab === tab.value} onClick={() => setActiveTab(tab.value)}>
            {tab.title}
          </TabItem>
        ))}
      </ListTab>
    </TabWrapper>
  )
}
