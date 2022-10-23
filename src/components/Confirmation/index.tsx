import styled, { keyframes } from "styled-components";
import { Trade } from "../../hooks/useSwap";
import { Token } from "../../hooks/useTokens";
import { ReactComponent as Arrow } from "../../assets/back.svg";
import { ReactComponent as Warning } from "../../assets/warning.svg";
import {
  Button,
  Detail,
  DetailLabel,
  DetailRight,
  DetailRow,
  ModalHeader,
  ModalTitle,
} from "../Widget/styled";
import useTheme from "../../hooks/useTheme";
import { useActiveWeb3 } from "../../hooks/useWeb3Provider";
import { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { NATIVE_TOKEN_ADDRESS } from "../../constants";
import { ReactComponent as BackIcon } from "../../assets/back.svg";
import { ReactComponent as Loading } from "../../assets/loader.svg";
import { ReactComponent as External } from "../../assets/external.svg";
import { ReactComponent as SuccessSVG } from "../../assets/success.svg";
import { ReactComponent as ErrorIcon } from "../../assets/error.svg";
import { ReactComponent as Info } from "../../assets/info.svg";

const Success = styled(SuccessSVG)`
  color: ${({ theme }) => theme.success};
`;

const Error = styled(ErrorIcon)`
  color: ${({ theme }) => theme.error};
`;

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
  text-align: left;
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

const Central = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  flex: 1;
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
  width: 94px;
  height: 94px;
  color: ${({ theme }) => theme.accent};
`;

const ViewTx = styled.a`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  color: ${({ theme }) => theme.accent};
  font-size: 14px;
  gap: 4px;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  border-bottom: 1px solid ${({ theme }) => theme.stroke};
`;

const WaitingText = styled.div`
  font-size: 1rem;
  font-weight: 500;
`;

const Amount = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  gap: 6px;
  img {
    border-radius: 50%;
  }
`;

const SubText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  margin-top: 12px;
`;

const ErrMsg = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  max-height: 200px;
  overflow-wrap: break-word;
  overflow-y: scroll;
  padding-top: 12px;
`;

const getScanLink = (chainId: number) => {
  switch (chainId) {
    case 137:
      return "https://polygonscan.com";
    default:
      return "https://etherscan.io";
  }
};

function calculateGasMargin(value: BigNumber): BigNumber {
  const defaultGasLimitMargin = BigNumber.from(20_000);
  const gasMargin = value.mul(BigNumber.from(2000)).div(BigNumber.from(10000));

  return gasMargin.gte(defaultGasLimitMargin)
    ? value.add(gasMargin)
    : value.add(defaultGasLimitMargin);
}

function Confirmation({
  trade,
  tokenInInfo,
  amountIn,
  tokenOutInfo,
  amountOut,
  rate,
  slippage,
  priceImpact,
  onClose,
}: {
  trade: Trade;
  tokenInInfo: Token;
  amountIn: string;
  tokenOutInfo: Token;
  amountOut: string;
  rate: number;
  slippage: number;
  priceImpact: number;
  onClose: () => void;
}) {
  const theme = useTheme();

  let minAmountOut = "--";

  if (amountOut) {
    minAmountOut = (Number(amountOut) * (1 - slippage / 10_000))
      .toPrecision(8)
      .toString();
  }

  const { provider, account, chainId } = useActiveWeb3();
  const [attempTx, setAttempTx] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [txStatus, setTxStatus] = useState<"success" | "failed" | "">("");
  const [txError, setTxError] = useState<any>("");

  useEffect(() => {
    if (txHash) {
      const i = setInterval(() => {
        provider?.getTransactionReceipt(txHash).then((res) => {
          if (!res) return;

          if (res.status) {
            setTxStatus("success");
          } else setTxStatus("failed");
        });
      }, 10_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [txHash, provider]);

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

      const gasEstimated = await provider?.estimateGas(estimateGasOption);

      const res = await provider?.getSigner().sendTransaction({
        ...estimateGasOption,
        gasLimit: calculateGasMargin(gasEstimated || BigNumber.from(0)),
      });

      setTxHash(res?.hash || "");
      setAttempTx(false);
    } catch (e) {
      setAttempTx(false);
      setTxError(e);
    }
  };

  if (attempTx || txHash)
    return (
      <>
        <Central>
          {txStatus === "success" ? (
            <Success />
          ) : txStatus === "failed" ? (
            <Error />
          ) : (
            <Spinner />
          )}
          {txHash ? (
            txStatus === "success" ? (
              <WaitingText>Transaction successful</WaitingText>
            ) : txStatus === "failed" ? (
              <WaitingText>Transaction failed</WaitingText>
            ) : (
              <WaitingText>Processing transaction</WaitingText>
            )
          ) : (
            <WaitingText>Waiting For Confirmation</WaitingText>
          )}
          <Amount>
            <img src={tokenInInfo.logoURI} width="16" height="16" />
            {+Number(amountIn).toPrecision(6)}
            <Arrow style={{ width: 16, transform: "rotate(180deg)" }} />
            <img src={tokenOutInfo.logoURI} width="16" height="16" />
            {+Number(amountOut).toPrecision(6)}
          </Amount>
          {!txHash && (
            <SubText>Confirm this transaction in your wallet</SubText>
          )}
          {txHash && txStatus === "" && (
            <SubText>Waiting for the transaction to be mined</SubText>
          )}
        </Central>

        <Divider />
        {txHash && (
          <ViewTx
            href={`${getScanLink(chainId)}/tx/${txHash}`}
            target="_blank"
            rel="noopener norefferer"
          >
            View transaction <External />
          </ViewTx>
        )}
        <Button style={{ marginTop: 0 }} onClick={onClose}>
          Close
        </Button>
      </>
    );

  if (txError)
    return (
      <>
        <Central>
          <Error />
          <WaitingText>Something went wrong</WaitingText>
        </Central>

        <div>
          <Divider />
          <div
            style={{
              display: "flex",
              padding: "8px 0",
              alignItems: "center",
              gap: "4px",
              fontSize: "14px",
            }}
          >
            <Info />
            Error details
          </div>
          <Divider />
          <ErrMsg>{txError?.data?.message || txError?.message}</ErrMsg>
        </div>

        <Divider />
        {txHash && (
          <ViewTx>
            View transaction <External />
          </ViewTx>
        )}
        <Button style={{ marginTop: 0 }} onClick={onClose}>
          Close
        </Button>
      </>
    );

  return (
    <>
      <ModalHeader>
        <ModalTitle onClick={onClose} role="button">
          <BackIcon />
          Confirm swap
        </ModalTitle>
      </ModalHeader>

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
