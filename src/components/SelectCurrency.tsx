import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { NATIVE_TOKEN, NATIVE_TOKEN_ADDRESS } from "../constants";
import useTokenBalances from "../hooks/useTokenBalances";
import { useTokens } from "../hooks/useTokens";
import { useActiveWeb3 } from "../hooks/useWeb3Provider";
import { ReactComponent as Loading } from "../assets/loader.svg";

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled(Loading)`
  animation: 2s ${rotate} linear infinite;
  width: 24px;
  height: 24px;
  color: ${({ theme }) => theme.accent};
`;

export const Input = styled.input`
  font-size: 0.75rem;
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme }) => theme.inputBackground};
  outline: none;
  border: none;
  color: ${({ theme }) => theme.text};
      ).filter(token => token.address.toLowerCase() === search.trim().toLowerCase() || token.name.includes(search.toLowerCase())),  box-shadow: ${({
        theme,
      }) => theme.boxShadow};
`;

const TokenListWrapper = styled.div`
  flex: 1;
  overflow-y: scroll;
`;

const TokenRow = styled.div<{ selected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;

  background: ${({ theme, selected }) =>
    selected ? theme.bg2 : "transparent"};

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

function SelectCurrency({
  selectedToken,
  onChange,
}: {
  selectedToken: string;
  onChange: (address: string) => void;
}) {
  const tokens = useTokens();
  const [search, setSearch] = useState("");
  const tokenAddress = tokens.map((item) => item.address);
  const { balances, loading } = useTokenBalances(tokenAddress);

  const { chainId } = useActiveWeb3();

  let tokenWithBalances = [
    {
      ...NATIVE_TOKEN[chainId],
      balance: balances[NATIVE_TOKEN_ADDRESS],
      formattedBalance: formatUnits(
        balances[NATIVE_TOKEN_ADDRESS] || BigNumber.from(0),
        18
      ),
    },

    ...tokens
      .map((item) => {
        const balance = balances[item.address];
        const formattedBalance = formatUnits(
          balance || BigNumber.from(0),
          item.decimals
        );

        return { ...item, balance, formattedBalance };
      })
      .sort(
        (a, b) =>
          parseFloat(b.formattedBalance) - parseFloat(a.formattedBalance)
      ),
  ].filter(
    (token) =>
      token.address.toLowerCase() === search.trim().toLowerCase() ||
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.symbol.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <Input
        placeholder="Search by token name, token symbol or address"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <TokenListWrapper>
        {tokenWithBalances.map((token) => {
          return (
            <TokenRow
              selected={token.address === selectedToken}
              key={token.address}
              onClick={() => {
                onChange(token.address);
              }}
            >
              <TokenInfo>
                <img
                  src={token.logoURI}
                  width="24"
                  height="24"
                  alt="logo"
                  style={{
                    borderRadius: "999px",
                  }}
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src = new URL(
                      "../assets/question.svg",
                      import.meta.url
                    ).href;
                  }}
                />
                <div style={{ textAlign: "left" }}>
                  <span>{token.symbol}</span>
                  <TokenName>{token.name}</TokenName>
                </div>
              </TokenInfo>

              {loading ? (
                <Spinner />
              ) : (
                <TokenBalance>
                  {token.balance &&
                    parseFloat(
                      parseFloat(token.formattedBalance).toPrecision(10)
                    )}
                </TokenBalance>
              )}
            </TokenRow>
          );
        })}
      </TokenListWrapper>
    </>
  );
}

export default SelectCurrency;
