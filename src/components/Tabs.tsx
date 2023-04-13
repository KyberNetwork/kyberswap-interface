import { rgba } from 'polished'
import { FC, ReactNode } from 'react'
import styled from 'styled-components'

interface TabsProps {
  activeKey: string | number
  items: Array<{
    key: string | number
    label: string | ReactNode
    children: ReactNode
  }>
  onChange: (activeKey: string | number) => void
  className?: string
}

const Wrapper = styled.div(({ theme }) => ({
  borderRadius: '20px',
  background: theme.buttonBlack,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}))

const TabHeader = styled.div(({ theme }) => ({
  display: 'flex',
  overflowY: 'scroll',
  borderBottom: `1px solid ${theme.border}`,
}))

const TabHeaderItem = styled.div<{ active: boolean }>(({ theme, active }) => ({
  display: 'flex',
  overflowY: 'scroll',
  padding: '0.5rem',
  borderRight: `1px solid ${theme.border}`,
  background: active ? rgba(theme.primary, 0.3) : theme.buttonBlack,
  color: active ? theme.primary : theme.subText,
  fontSize: '12px',
  fontWeight: '500',
  cursor: 'pointer',
}))

const Tabs: FC<TabsProps> = ({ activeKey, items, className, onChange }) => {
  return (
    <Wrapper className={className}>
      <TabHeader>
        {items.map(item => (
          <TabHeaderItem
            active={item.key === activeKey}
            key={item.key}
            role="button"
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </TabHeaderItem>
        ))}
      </TabHeader>
      {items.find(item => item.key === activeKey)?.children}
    </Wrapper>
  )
}

export default Tabs
