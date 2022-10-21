import styled from "styled-components";
import { Trade } from "../hooks/useSwap";
import { Token } from "../hooks/useTokens";
import { ReactComponent as Arrow } from "../assets/back.svg";
import { ReactComponent as Warning } from "../assets/warning.svg";
import {
  Button,
  Detail,
  DetailLabel,
  DetailRight,
  DetailRow,
} from "./Widget/styled";
import useTheme from "../hooks/useTheme";
import { useActiveWeb3 } from "../hooks/useWeb3Provider";
import { useState } from "react";
import { BigNumber } from "ethers";
import { NATIVE_TOKEN_ADDRESS } from "../constants";

const ArrowDown = styled(Arrow)`
  color: ${({ theme }) => theme.subText};
  transform: rotate(-90deg);
`;

const Flex = styled.div`
  display: flex;
  font-size: 1.5rem;
  gap: 0.5rem;
  align-items: center;
  font-weight: 500;

  img {
    border-radius: 50%;
  }
`;

const Note = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 0.75rem;
`;

const PriceImpactHigh = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: ${({ theme }) => theme.buttonRadius};
  background: ${({ theme }) => theme.warning + "40"};
  color: ${({ theme }) => theme.warning};
  font-size: 12px;
  font-weight: 500px;
  padding: 12px;
`;

const PriceImpactVeryHigh = styled(PriceImpactHigh)`
  background: ${({ theme }) => theme.error + "40"};
  color: ${({ theme }) => theme.error};
`;

function Confirmation({
  trade,
  tokenInInfo,
  amountIn,
  tokenOutInfo,
  amountOut,
  rate,
  slippage,
  priceImpact,
}: {
  trade: Trade;
  tokenInInfo: Token;
  amountIn: string;
  tokenOutInfo: Token;
  amountOut: string;
  rate: number;
  slippage: number;
  priceImpact: number;
}) {
  const theme = useTheme();

  let minAmountOut = "--";

  if (amountOut) {
    minAmountOut = (Number(amountOut) * (1 - slippage / 10_000))
      .toPrecision(8)
      .toString();
  }

  const { provider, chainId, account } = useActiveWeb3();
  const [attempTx, setAttempTx] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState<any>("");

  const confirmSwap = async () => {
    const estimateGasOption = {
      from: account,
      to: trade?.routerAddress,
      data: trade?.encodedSwapData,
      value: BigNumber.from(
        tokenInInfo.address === NATIVE_TOKEN_ADDRESS ? trade?.inputAmount : 0
      ),
    };

    try {
      setAttempTx(true);
      setTxHash("");
      setTxError(false);
      const res = await provider
        ?.getSigner()
        .sendTransaction(estimateGasOption);

      setTxHash(res?.hash || "");
      setAttempTx(false);
    } catch (e) {
      setAttempTx(false);
      setTxError(e);
    }
  };

  return (
    <>
      <Flex>
        <img src={tokenInInfo.logoURI} width="28" height="28" />
        {+Number(amountIn).toPrecision(10)}
        <div>{tokenInInfo.symbol}</div>
      </Flex>

      <ArrowDown />

      <Flex>
        <img src={tokenOutInfo.logoURI} width="28" height="28" />
        {+Number(amountOut).toPrecision(10)}
        <div>{tokenOutInfo.symbol}</div>
      </Flex>

      <Note>
        Output is estimated. You will receive at least {minAmountOut} KNC or the
        transaction will revert.
      </Note>

      <Detail>
        <DetailRow>
          <DetailLabel>Current Price</DetailLabel>
          <DetailRight>
            1 {tokenInInfo.symbol} = {rate.toPrecision(6)} {tokenOutInfo.symbol}
          </DetailRight>
        </DetailRow>

        <DetailRow>
          <DetailLabel>Minimum Received</DetailLabel>
          <DetailRight>
            {minAmountOut} {tokenOutInfo.symbol}
          </DetailRight>
        </DetailRow>

        <DetailRow>
          <DetailLabel>Gas Fee</DetailLabel>
          <DetailRight>${trade.gasUsd.toPrecision(4)}</DetailRight>
        </DetailRow>

        <DetailRow>
          <DetailLabel>Price Impact</DetailLabel>
          <DetailRight
            style={{
              color:
                priceImpact > 15
                  ? theme.error
                  : priceImpact > 5
                  ? theme.warning
                  : theme.text,
            }}
          >
            {priceImpact === -1
              ? "--"
              : priceImpact > 0.01
              ? priceImpact.toFixed(3) + "%"
              : "< 0.01%"}
          </DetailRight>
        </DetailRow>

        <DetailRow>
          <DetailLabel>Slippage</DetailLabel>
          <DetailRight>{(slippage * 100) / 10_000}%</DetailRight>
        </DetailRow>
      </Detail>

      <div style={{ marginTop: "auto" }}>
        {priceImpact > 15 ? (
          <PriceImpactVeryHigh>
            <Warning /> Price Impact is Very High
          </PriceImpactVeryHigh>
        ) : priceImpact > 5 ? (
          <PriceImpactHigh>
            <Warning /> Price Impact is High
          </PriceImpactHigh>
        ) : priceImpact === -1 ? (
          <PriceImpactHigh>
            <Warning />
            Unable to calculate Price Impact
          </PriceImpactHigh>
        ) : null}
        <Button onClick={confirmSwap}>Confirm swap</Button>
      </div>
    </>
  );
}

export default Confirmation;
