import styled from 'styled-components'

import Input from 'components/Input'
import Select from 'components/Select'

export const ContentWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: row;
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`

export const CustomBox = styled.div`
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 12px;
  flex-direction: column;
  gap: 0.5rem;
  display: flex;
`

export const CustomInput = styled(Input)`
  border: none;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  flex: 1;
`

export const CustomSelect = styled(Select)`
  width: 100%;
  padding: 4px 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  flex: 1;
`
