import { useState } from 'react'
import styled, { css } from 'styled-components'

const TabItem = styled.div<{ isActive?: boolean }>`
  text-align: center;
  padding: 4px 12px;
  font-family: 'Work Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  user-select: none;

  border-radius: 20px;

  transition: all 150ms;

  ${({ isActive, theme }) =>
    isActive &&
    css`
      font-weight: 500;
      text-align: center;
      color: ${theme.text};
      background: #313131;
    `}
`

type Props = {
  className?: string
}

const TabSelector: React.FC<Props> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<1 | 2>(1)

  return (
    <div className={className}>
      <TabItem isActive={activeTab === 1} role="button" onClick={() => setActiveTab(1)}>
        Active Transfers
      </TabItem>
      <TabItem isActive={activeTab === 2} role="button" onClick={() => setActiveTab(2)}>
        Transfer History
      </TabItem>
    </div>
  )
}

export default styled(TabSelector)`
  display: flex;
  gap: 16px;
`
