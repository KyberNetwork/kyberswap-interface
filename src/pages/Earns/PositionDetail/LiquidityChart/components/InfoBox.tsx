import { ReactNode } from 'react'
import styled from 'styled-components'

const Box = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`

const Message = styled.div`
  font-weight: 700;
  font-size: 1.25rem;
  line-height: 1.75rem;
  text-align: center;
  padding-top: 4px;
  color: ${({ theme }) => theme.subText};
`

export function InfoBox({ message, icon }: { message?: ReactNode; icon: ReactNode }) {
  return (
    <Box>
      {icon}
      {message && <Message>{message}</Message>}
    </Box>
  )
}
