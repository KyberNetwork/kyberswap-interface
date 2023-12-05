import { useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import CheckBox from 'components/CheckBox'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Popover from 'components/Popover'
import Row from 'components/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { DisplayField } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'

const SettingsWrapper = styled.div`
  padding: 16px;
  border-radius: 20px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: ${({ theme }) => theme.tableHeader};
`

export default function ActionPopup({
  fields,
  onChangeDisplayField,
}: {
  fields: DisplayField[]
  onChangeDisplayField: (fields: DisplayField[]) => void
}) {
  const theme = useTheme()
  const [localFields, setLocalStateFields] = useState(fields)

  useEffect(() => {
    setLocalStateFields(fields)
  }, [fields])

  const [showSettings, setShowSettings] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setShowSettings(false)
    onChangeDisplayField(localFields)
  })

  return (
    <Popover
      show={showSettings}
      style={{ backgroundColor: theme.tableHeader }}
      containerStyle={{ height: '16px', cursor: 'pointer' }}
      opacity={1}
      content={
        <SettingsWrapper ref={ref}>
          {localFields.map(item => (
            <Row key={item.title} gap="8px">
              <CheckBox
                id={`field-${item.key}`}
                checked={item.show}
                style={{ width: '12px', height: '12px' }}
                onClick={e => e.stopPropagation()}
                onChange={() =>
                  setLocalStateFields(prev => prev.map(el => (el.key === item.key ? { ...el, show: !el.show } : el)))
                }
              />
              <Text fontSize={14} as="label" htmlFor={`field-${item.key}`} fontWeight={'500'} color={theme.subText}>
                {item.title}
              </Text>
            </Row>
          ))}
        </SettingsWrapper>
      }
      noArrow={true}
      placement="bottom-end"
    >
      <TransactionSettingsIcon fill={theme.subText} size={16} onClick={() => setShowSettings(v => !v)} />
    </Popover>
  )
}
