import styled from "styled-components";

export const Wrapper = styled.div`
  border-radius: 1rem;
  padding: 1rem;
  width: 400px;
  background: ${({ theme }) => theme.bg1};
  color: ${({ theme }) => theme.text};
  font-family: "Work Sans", "Inter var", sans-serif;
  position: relative;
  overflow: hidden;
`;

export const Title = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 1.125rem;
  font-weight: 500;
  align-items: center;
`;

export const InputWrapper = styled.div`
  border-radius: 1rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.bg2};
  margin-top: 1rem;
`;

export const MaxHalfBtn = styled.button`
  outline: none;
  border: none;
  background: ${({ theme }) => theme.subText + "33"};
  border-radius: 999px;
  color: ${({ theme }) => theme.subText};
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  font-weight: 500;
  cursor: pointer;
  margin-right: 0.25rem;

  :hover {
    opacity: 0.8;
  }
`;

export const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SettingBtn = styled.button`
  outline: none;
  border: none;
  border-radius: 50%;
  width: 2.25rem;
  height: 2.25rem;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.subText};

  :hover {
    background: ${({ theme }) => theme.bg2};
  }
`;

export const SwitchBtn = styled(SettingBtn)`
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.bg2};
  margin-top: 1rem;

  :hover {
    opacity: 0.8;
  }
`;

export const AccountBalance = styled.div`
  gap: 4px;
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.subText};
`;

export const InputRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.75rem;
`;

export const Input = styled.input`
  flex: 1;
  font-size: 1.5rem;
  background: ${({ theme }) => theme.bg2};
  outline: none;
  border: none;
  color: ${({ theme }) => theme.text};

  :disabled {
    cursor: not-allowed;
  }
`;

export const SelectTokenBtn = styled.button`
  outline: none;
  border: none;
  background: ${({ theme }) => theme.bg1};
  border-radius: 999px;
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
`;

export const MiddleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Button = styled.button`
  outline: none;
  border: none;
  border-radius: 999px;
  width: 100%;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.75rem;
  background: ${({ theme }) => theme.primary};
  cursor: pointer;
`;
