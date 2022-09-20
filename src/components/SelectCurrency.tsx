import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import styled from "styled-components";
import { NATIVE_TOKEN, NATIVE_TOKEN_ADDRESS } from "../constants";
import { defaultTokenList } from "../constants/tokens";
import useTokenBalances from "../hooks/useTokenBalances";
import { useActiveWeb3 } from "../hooks/useWeb3Provider";

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
  const tokenAddress = defaultTokenList.map((item) => item.address);
  const { balances } = useTokenBalances(tokenAddress);

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

    ...defaultTokenList
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
  ];

  return (
    <>
      <Input placeholder="Search by token name or address" />
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
                <div>
                  <div>{token.symbol}</div>
                  <TokenName>{token.name}</TokenName>
                </div>
              </TokenInfo>

              <TokenBalance>
                {token.balance &&
                  parseFloat(
                    parseFloat(token.formattedBalance).toPrecision(10)
                  )}
              </TokenBalance>
            </TokenRow>
          );
        })}
      </TokenListWrapper>
    </>
  );
}

export default SelectCurrency;
