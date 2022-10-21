import { StrictMode, useEffect, useState } from "react";
import styled, { ThemeProvider } from "styled-components";
import { defaultTheme, Theme } from "../../theme";
import { ReactComponent as SettingIcon } from "../../assets/setting.svg";
import { ReactComponent as WalletIcon } from "../../assets/wallet.svg";
import { ReactComponent as DropdownIcon } from "../../assets/dropdown.svg";
import { ReactComponent as SwitchIcon } from "../../assets/switch.svg";
import { ReactComponent as SwapIcon } from "../../assets/swap.svg";
import { ReactComponent as BackIcon } from "../../assets/back.svg";
import { ReactComponent as ErrorIcon } from "../../assets/x-circle.svg";
import { ReactComponent as SubmittedIcon } from "../../assets/arrow-up-circle.svg";

import useTheme from "../../hooks/useTheme";

import {
  AccountBalance,
  BalanceRow,
  Input,
  InputRow,
  InputWrapper,
  MaxHalfBtn,
  MiddleRow,
  SelectTokenBtn,
  SettingBtn,
  SwitchBtn,
  Title,
  Wrapper,
  Button,
  Dots,
  CustomLightSpinner,
  Rate,
  MiddleLeft,
  Detail,
  DetailTitle,
  Divider,
  DetailRow,
  DetailLabel,
  DetailRight,
} from "./styled";

import { BigNumber } from "ethers";
import { NATIVE_TOKEN, NATIVE_TOKEN_ADDRESS, ZIndex } from "../../constants";
import SelectCurrency from "../SelectCurrency";
import { useActiveWeb3, Web3Provider } from "../../hooks/useWeb3Provider";
import useSwap from "../../hooks/useSwap";
import useTokenBalances from "../../hooks/useTokenBalances";
import { formatUnits } from "ethers/lib/utils";
import useApproval, { APPROVAL_STATE } from "../../hooks/useApproval";
import Settings from "../Settings";
import { Token, TokenListProvider, useTokens } from "../../hooks/useTokens";
import RefreshBtn from "../RefreshBtn";
import Confirmation from "../Confirmation";

export const DialogWrapper = styled.div`
  background-color: ${({ theme }) => theme.tab};
  position: absolute;
  left: 0;
  top: 0;
  width: calc(100% - 2rem);
  height: calc(100% - 2rem);
  padding: 1rem;
  overflow: hidden;
  z-index: ${ZIndex.DIALOG};
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @supports (overflow: clip) {
    overflow: clip;
  }

  transition: 0.25s ease-in-out;

  &.open {
    transform: translateX(0);
  }

  &.close {
    transform: translateX(100%);
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.div`
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
`;

const SelectTokenText = styled.span`
  font-size: 16px;
  width: max-content;
`;

const FlexCenter = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  height: 100%;
`;

const ConfirmText = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  margin-top: 1.5rem;
`;

enum ModalType {
  SETTING = "setting",
  CURRENCY_IN = "currency_in",
  CURRENCY_OUT = "currency_out",
  REVIEW = "review",
}

export interface WidgetProps {
  provider?: any;
  tokenList?: Token[];
  theme?: Theme;
  defaultTokenIn?: string;
  defaultTokenOut?: string;
}

const Widget = ({
  defaultTokenIn,
  defaultTokenOut,
}: {
  defaultTokenIn?: string;
  defaultTokenOut?: string;
}) => {
  const [showModal, setShowModal] = useState<ModalType | null>(null);
  const { provider, chainId, account } = useActiveWeb3();
  const tokens = useTokens();
  const {
    loading,
    error,
    tokenIn,
    tokenOut,
    setTokenIn,
    setTokenOut,
    inputAmout,
    setInputAmount,
    trade,
    slippage,
    setSlippage,
    getRate,
  } = useSwap({
    defaultTokenIn,
    defaultTokenOut,
  });

  const [inverseRate, setInverseRate] = useState(false);

  const { balances } = useTokenBalances(tokens.map((item) => item.address));

  const tokenInInfo =
    tokenIn === NATIVE_TOKEN_ADDRESS
      ? NATIVE_TOKEN[chainId]
      : tokens.find((item) => item.address === tokenIn);

  const tokenOutInfo =
    tokenOut === NATIVE_TOKEN_ADDRESS
      ? NATIVE_TOKEN[chainId]
      : tokens.find((item) => item.address === tokenOut);

  const amountOut = trade?.outputAmount
    ? formatUnits(trade.outputAmount, tokenOutInfo?.decimals).toString()
    : "";

  let minAmountOut = "";

  if (amountOut) {
    minAmountOut = (Number(amountOut) * (1 - slippage / 10_000))
      .toPrecision(8)
      .toString();
  }

  const tokenInBalance = balances[tokenIn] || BigNumber.from(0);
  const tokenOutBalance = balances[tokenOut] || BigNumber.from(0);

  const tokenInWithUnit = formatUnits(
    tokenInBalance,
    tokenInInfo?.decimals || 18
  );
  const tokenOutWithUnit = formatUnits(
    tokenOutBalance,
    tokenOutInfo?.decimals || 18
  );

  const rate =
    trade?.inputAmount &&
    trade?.outputAmount &&
    parseFloat(formatUnits(trade.outputAmount, tokenOutInfo?.decimals || 18)) /
      parseFloat(formatUnits(trade.inputAmount, tokenInInfo?.decimals || 18));

  const formattedTokenInBalance = parseFloat(
    parseFloat(tokenInWithUnit).toPrecision(10)
  );

  const formattedTokenOutBalance = parseFloat(
    parseFloat(tokenOutWithUnit).toPrecision(10)
  );

  const theme = useTheme();

  const priceImpact = !trade?.amountOutUsd
    ? -1
    : ((-trade.amountOutUsd + trade.amountInUsd) * 100) / trade.amountInUsd;

  const modalTitle = (() => {
    switch (showModal) {
      case ModalType.SETTING:
        return "Settings";
      case ModalType.CURRENCY_IN:
        return "Select a token";
      case ModalType.CURRENCY_OUT:
        return "Select a token";
      case ModalType.REVIEW:
        return "Confirm swap";
      default:
        return null;
    }
  })();

  const modalContent = (() => {
    switch (showModal) {
      case ModalType.SETTING:
        return <Settings slippage={slippage} setSlippage={setSlippage} />;
      case ModalType.CURRENCY_IN:
        return (
          <SelectCurrency
            selectedToken={tokenIn}
            onChange={(address) => {
              if (address === tokenOut) setTokenOut(tokenIn);
              setTokenIn(address);
              setShowModal(null);
            }}
          />
        );
      case ModalType.CURRENCY_OUT:
        return (
          <SelectCurrency
            selectedToken={tokenOut}
            onChange={(address) => {
              if (address === tokenIn) setTokenIn(tokenOut);
              setTokenOut(address);
              setShowModal(null);
            }}
          />
        );
      case ModalType.REVIEW:
        if (rate && tokenInInfo && trade && tokenOutInfo)
          return (
            <Confirmation
              trade={trade}
              tokenInInfo={tokenInInfo}
              amountIn={inputAmout}
              tokenOutInfo={tokenOutInfo}
              amountOut={amountOut}
              rate={rate}
              priceImpact={priceImpact}
              slippage={slippage}
            />
          );
        return null;
      // return (
      //   <FlexCenter>
      //     {attempTx ? (
      //       <>
      //         <CustomLightSpinner
      //           size="90px"
      //           src={
      //             new URL("../../assets/blue-loader.svg", import.meta.url)
      //               .href
      //           }
      //         />

      //         <ConfirmText>
      //           Please confirm transaction on your wallet
      //         </ConfirmText>
      //       </>
      //     ) : txHash ? (
      //       <>
      //         <SubmittedIcon style={{ width: "60px", height: "60px" }} />
      //         <ConfirmText>Transaction submitted</ConfirmText>
      //       </>
      //     ) : (
      //       <>
      //         <ErrorIcon
      //           style={{ width: "60px", height: "60px", color: "red" }}
      //         />
      //         <ConfirmText>Error</ConfirmText>
      //       </>
      //     )}
      //   </FlexCenter>
      // );
      default:
        return null;
    }
  })();

  const {
    loading: checkingAllowance,
    approve,
    approvalState,
  } = useApproval(
    BigNumber.from(trade?.inputAmount || 0),
    tokenIn,
    trade?.routerAddress || ""
  );

  return (
    <Wrapper>
      <DialogWrapper className={showModal ? "open" : "close"}>
        <ModalHeader>
          <ModalTitle onClick={() => setShowModal(null)} role="button">
            <BackIcon />
            {modalTitle}
          </ModalTitle>
        </ModalHeader>
        {modalContent}
      </DialogWrapper>
      <Title>
        Swap
        <SettingBtn onClick={() => setShowModal(ModalType.SETTING)}>
          <SettingIcon />
        </SettingBtn>
      </Title>
      <InputWrapper>
        <BalanceRow>
          <div>
            <MaxHalfBtn onClick={() => setInputAmount(tokenInWithUnit)}>
              Max
            </MaxHalfBtn>
            {/* <MaxHalfBtn>Half</MaxHalfBtn> */}
          </div>
          <AccountBalance>
            <WalletIcon />
            {formattedTokenInBalance}
          </AccountBalance>
        </BalanceRow>

        <InputRow>
          <Input
            value={inputAmout}
            onChange={(e) => {
              const value = e.target.value.replace(/,/g, ".");
              const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
              if (
                value === "" ||
                inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
              ) {
                setInputAmount(value);
              }
            }}
            inputMode="decimal"
            autoComplete="off"
            autoCorrect="off"
            type="text"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0.0"
            minLength={1}
            maxLength={79}
            spellCheck="false"
          />
          <SelectTokenBtn onClick={() => setShowModal(ModalType.CURRENCY_IN)}>
            {tokenInInfo ? (
              <>
                <img
                  width="20"
                  height="20"
                  src={tokenInInfo?.logoURI}
                  style={{ borderRadius: "50%" }}
                />
                <div style={{ marginLeft: "0.375rem" }}>
                  {tokenInInfo?.symbol}
                </div>
              </>
            ) : (
              <SelectTokenText>Select a token</SelectTokenText>
            )}
            <DropdownIcon />
          </SelectTokenBtn>
        </InputRow>
      </InputWrapper>

      <MiddleRow>
        <MiddleLeft>
          <RefreshBtn
            loading={loading}
            onRefresh={() => {
              getRate();
            }}
            trade={trade}
          />
          <Rate>
            {(() => {
              if (!rate) return "--";
              return !inverseRate
                ? `1 ${tokenInInfo?.symbol} = ${+rate.toPrecision(10)} ${
                    tokenOutInfo?.symbol
                  }`
                : `1 ${tokenOutInfo?.symbol} = ${+(1 / rate).toPrecision(10)} ${
                    tokenInInfo?.symbol
                  }`;
            })()}
          </Rate>

          {!!rate && (
            <SettingBtn onClick={() => setInverseRate((prev) => !prev)}>
              <SwapIcon />
            </SettingBtn>
          )}
        </MiddleLeft>

        <SwitchBtn
          onClick={() => {
            setTokenIn(tokenOut);
            setTokenOut(tokenIn);
          }}
        >
          <SwitchIcon />
        </SwitchBtn>
      </MiddleRow>

      <InputWrapper>
        <BalanceRow>
          <div />
          <AccountBalance>
            <WalletIcon />
            {formattedTokenOutBalance}
          </AccountBalance>
        </BalanceRow>

        <InputRow>
          <Input disabled value={amountOut} />
          <SelectTokenBtn onClick={() => setShowModal(ModalType.CURRENCY_OUT)}>
            {tokenOutInfo ? (
              <>
                <img
                  width="20"
                  height="20"
                  src={tokenOutInfo?.logoURI}
                  style={{ borderRadius: "50%" }}
                />
                <div style={{ marginLeft: "0.375rem" }}>
                  {tokenOutInfo?.symbol}
                </div>
              </>
            ) : (
              <SelectTokenText>Select a token</SelectTokenText>
            )}
            <DropdownIcon />
          </SelectTokenBtn>
        </InputRow>
      </InputWrapper>

      <Detail style={{ marginTop: "1rem" }}>
        <DetailTitle>More information</DetailTitle>
        <Divider />
        <DetailRow>
          <DetailLabel>Minimum Received</DetailLabel>
          <DetailRight>
            {minAmountOut ? `${minAmountOut} ${tokenOutInfo?.symbol}` : "--"}
          </DetailRight>
        </DetailRow>

        <DetailRow>
          <DetailLabel>Gas Fee</DetailLabel>
          <DetailRight>
            {trade?.gasUsd ? "$" + trade.gasUsd.toPrecision(4) : "--"}
          </DetailRight>
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
      </Detail>

      <Button
        disabled={
          !!error ||
          loading ||
          checkingAllowance ||
          approvalState === APPROVAL_STATE.PENDING
        }
        onClick={async () => {
          if (approvalState === APPROVAL_STATE.NOT_APPROVED) {
            approve();
          } else {
            setShowModal(ModalType.REVIEW);
          }
        }}
      >
        {loading ? (
          <Dots>Calculate best route</Dots>
        ) : error ? (
          error
        ) : checkingAllowance ? (
          <Dots>Checking Allowance</Dots>
        ) : approvalState === APPROVAL_STATE.NOT_APPROVED ? (
          "Approve"
        ) : approvalState === APPROVAL_STATE.PENDING ? (
          <Dots>Approving</Dots>
        ) : (
          "Swap"
        )}
      </Button>
    </Wrapper>
  );
};

export default ({
  provider,
  tokenList,
  theme,
  defaultTokenIn,
  defaultTokenOut,
}: WidgetProps) => {
  return (
    <StrictMode>
      <ThemeProvider theme={theme || defaultTheme}>
        <Web3Provider provider={provider}>
          <TokenListProvider tokenList={tokenList}>
            <Widget
              defaultTokenIn={defaultTokenIn}
              defaultTokenOut={defaultTokenOut}
            />
          </TokenListProvider>
        </Web3Provider>
      </ThemeProvider>
    </StrictMode>
  );
};
