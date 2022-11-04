import { BigNumber } from "ethers";
import { formatUnits, isAddress } from "ethers/lib/utils";
import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { NATIVE_TOKEN, NATIVE_TOKEN_ADDRESS } from "../constants";
import useTokenBalances from "../hooks/useTokenBalances";
import { useImportedTokens, useTokens } from "../hooks/useTokens";
import { useActiveWeb3 } from "../hooks/useWeb3Provider";
import { ReactComponent as Loading } from "../assets/loader.svg";
import { ReactComponent as Question } from "../assets/question.svg";
import { ReactComponent as TrashIcon } from "../assets/trash.svg";
import { useToken } from "../hooks/useToken";
import { Button } from "./Widget/styled";
import { TokenInfo as TokenDetail } from "../constants";

const Trash = styled(TrashIcon)`
  width: 20px;
  height: 20px;
  cursor: pointer;
  color: ${({ theme }) => theme.text};

  :hover {
    color: ${({ theme }) => theme.error};
  }
`;

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
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.accent};

  path {
    stroke-width: 8;
  }
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

  /* width */
  ::-webkit-scrollbar {
    display: unset;
    width: 6px;
    border-radius: 999px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.subText + "66"};
    border-radius: 999px;
  }
`;

const TokenRow = styled.div<{ selected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;

  background: ${({ theme, selected }) =>
    selected ? theme.inputBackground : "transparent"};

  :hover {
    background: ${({ theme }) => theme.inputBackground};
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
  overflow: hidden;
  max-width: 6rem;
  text-overflow: ellipsis;
`;

const Tabs = styled.div`
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.stroke};
  display: flex;
  gap: 24px;
  cursor: pointer;
`;

const Tab = styled.div<{ active: boolean }>`
  color: ${({ theme, active }) => (active ? theme.accent : theme.text)};
  hover: ${({ theme }) => theme.accent};
  font-size: 14px;
  font-weight: 500;
`;

const NotFound = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
`;

const ImportToken = ({
  address,
  onImport,
}: {
  address: string;
  onImport: (token: TokenDetail) => void;
}) => {
  const token = useToken(address);

  if (!token) return null;

  return (
    <TokenRow selected={false}>
      <TokenInfo>
        <Question />
        <div style={{ textAlign: "left" }}>
          <span>{token.symbol}</span>
          <TokenName>{token.name}</TokenName>
        </div>
      </TokenInfo>

      <Button
        style={{ width: "fit-content", padding: "8px 16px", marginTop: 0 }}
        onClick={() => onImport(token)}
      >
        Import
      </Button>
    </TokenRow>
  );
};

function SelectCurrency({
  selectedToken,
  onChange,
  onImport,
}: {
  selectedToken: string;
  onChange: (address: string) => void;
  onImport: (token: TokenDetail) => void;
}) {
  const tokens = useTokens();
  const [search, setSearch] = useState("");
  const tokenAddress = tokens.map((item) => item.address);
  const { balances, loading } = useTokenBalances(tokenAddress);
  const { removeToken } = useImportedTokens();

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

  const [tab, setTab] = useState<"all" | "imported">("all");

  return (
    <>
      <Input
        placeholder="Search by token name, token symbol or address"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Tabs>
        <Tab active={tab === "all"} onClick={() => setTab("all")} role="button">
          All
        </Tab>
        <Tab
          active={tab === "imported"}
          onClick={() => setTab("imported")}
          role="button"
        >
          Imported
        </Tab>
      </Tabs>
      <TokenListWrapper>
        {!tokenWithBalances.length && isAddress(search.trim()) && (
          <ImportToken
            address={search.trim()}
            onImport={onImport}
          ></ImportToken>
        )}

        {!tokenWithBalances.filter((item) =>
          tab === "imported" ? item.isImport : true
        ).length &&
          !isAddress(search.trim()) && <NotFound>No results found</NotFound>}

        {tokenWithBalances
          .filter((item) => (tab === "imported" ? item.isImport : true))
          .map((token) => {
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

                {tab === "imported" ? (
                  <Trash
                    onClick={(e) => {
                      e.stopPropagation();
                      removeToken(token);
                    }}
                  />
                ) : loading ? (
                  <Spinner />
                ) : (
                  <TokenBalance>
                    {token.balance &&
                    parseFloat(token.formattedBalance) < 0.000001
                      ? token.formattedBalance
                      : parseFloat(
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
