import styled from 'styled-components'

interface WrapperProps {
  width?: number
}

export const Wrapper = styled.div<WrapperProps>`
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 1rem;
  width: ${({ width }) => `${width || 375}px`};
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.text};
  font-family: ${({ theme }) => theme.fontFamily || `"Work Sans", "Inter var", sans-serif`};
  position: relative;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.boxShadow};
  height: max-content;
`

export const Title = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 1.25rem;
  font-weight: 500;
  align-items: center;
`

export const InputWrapper = styled.div`
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 0.75rem;
  background: ${({ theme }) => theme.secondary};
  margin-top: 1rem;
  box-shadow: ${({ theme }) => theme.boxShadow};
`

export const MaxHalfBtn = styled.button`
  outline: none;
  border: none;
  background: ${({ theme }) => theme.interactive};
  border-radius: ${({ theme }) => theme.buttonRadius};
  color: ${({ theme }) => theme.subText};
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  font-weight: 500;
  cursor: pointer;
  margin-right: 0.25rem;

  :hover {
    opacity: 0.8;
  }
`

export const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const SettingBtn = styled.button`
  outline: none;
  border: none;
  border-radius: ${({ theme }) => theme.buttonRadius};
  width: 2.25rem;
  height: 2.25rem;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.subText};

  :hover {
    background: ${({ theme }) => theme.secondary};
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`

export const SwitchBtn = styled(SettingBtn)`
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.secondary};

  :hover {
    opacity: 0.8;
  }
`

export const AccountBalance = styled.div`
  gap: 4px;
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.subText};
`

export const InputRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.75rem;
`

export const Input = styled.input`
  width: 100%;
  font-size: 1.5rem;
  background: ${({ theme }) => theme.secondary};
  outline: none;
  border: none;
  color: ${({ theme }) => theme.text};

  :disabled {
    cursor: not-allowed;
  }
`

export const SelectTokenBtn = styled.button`
  outline: none;
  border: none;
  background: ${({ theme }) => theme.interactive};
  border-radius: ${({ theme }) => theme.buttonRadius};
  padding: 0.375rem 0 0.375rem 0.5rem;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.subText};
  display: flex;
  align-items: center;
  font-weight: 500;
  cursor: pointer;

  :hover {
    opacity: 0.8;
  }
`

export const MiddleRow = styled.div`
  display: flex;
  margin-top: 1rem;
  align-items: center;
  justify-content: space-between;
`

export const MiddleLeft = styled.div`
  display: flex;
  align-items: center;
`

export const Button = styled.button`
  outline: none;
  border: none;
  border-radius: ${({ theme }) => theme.buttonRadius};
  width: 100%;
  margin-top: 1rem;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.75rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.dialog};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.boxShadow};

  :disabled {
    color: ${({ theme }) => theme.subText};
    background: ${({ theme }) => theme.interactive};
    cursor: not-allowed;

    :active {
      transform: none;
    }
  }

  :active {
    transform: scale(0.99);
  }
`

export const Dots = styled.span`
  &::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: '.';
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
`

export const Rate = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  margin-left: 4px;
`

export const Detail = styled.div`
  background: ${({ theme }) => theme.secondary};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.stroke};
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 12px;
`

export const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
`
export const DetailLabel = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};
`
export const DetailRight = styled.div`
  font-weight: 500;
`

export const DetailTitle = styled.div`
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  text-transform: uppercase;
  text-align: left;
`
export const ViewRouteTitle = styled.div`
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  text-align: right;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
`
export const Divider = styled.div`
  width: 100%;
  height: 1px;
  border-bottom: 1px solid ${({ theme }) => theme.stroke};
`
export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const ModalTitle = styled.div`
  cursor: pointer;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 500;
  :hover {
    opacity: 0.8;
  }

  > svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`
