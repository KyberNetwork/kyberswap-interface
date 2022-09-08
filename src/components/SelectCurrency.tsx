import { useConnectWallet } from "@web3-onboard/react";
import { useEffect } from "react";
import styled from "styled-components";
import { defaultTokenList } from "../constants/tokens";

const Input = styled.input`
  font-size: 1rem;
  padding: 0.75rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.bg2};
  outline: none;
  border: none;
  color: ${({ theme }) => theme.text};
`;

const TokenListWrapper = styled.div`
  flex: 1;
  overflow-y: scroll;
`;

const TokenRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;

  :hover {
    background: ${({ theme }) => theme.bg2};
  }
`;

const TokenInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1rem;
`;

const TokenName = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 0.75rem;
`;

const TokenBalance = styled.div`
  font-size: 1rem;
`;

function SelectCurrency() {
  const [{ wallet }, , , updateBalances] = useConnectWallet();

  const tokenAddress = defaultTokenList.map((item) => item.address);
  useEffect(() => {
    updateBalances(tokenAddress).then(console.log);
  }, [updateBalances]);

  console.log(wallet);

  return (
    <>
      <Input placeholder="Search by token name or address" />
      <TokenListWrapper>
        {defaultTokenList.map((token) => {
          return (
            <TokenRow>
              <TokenInfo>
                <img
                  src={token.logoURI}
                  width="24"
                  height="24"
                  alt="logo"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src = new URL(
                      "../assets/question.svg",
                      import.meta.url
                    ).href;
                  }}
                />
                <div>
                  <div>{token.symbol}</div>
                  <TokenName>{token.name}</TokenName>
                </div>
              </TokenInfo>

              <TokenBalance>1.23123</TokenBalance>
            </TokenRow>
          );
        })}
      </TokenListWrapper>
    </>
  );
}

export default SelectCurrency;
