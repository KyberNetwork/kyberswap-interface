import { StrictMode, useState } from "react";
import styled, { ThemeProvider } from "styled-components";
import { darkTheme } from "../../theme";
import { ReactComponent as SettingIcon } from "../../assets/setting.svg";
import { ReactComponent as WalletIcon } from "../../assets/wallet.svg";
import { ReactComponent as DropdownIcon } from "../../assets/dropdown.svg";
import { ReactComponent as SwitchIcon } from "../../assets/switch.svg";
import { ReactComponent as BackIcon } from "../../assets/back.svg";

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
} from "./styled";

import { init, useConnectWallet } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import { BigNumber, ethers, providers } from "ethers";
import {
  NATIVE_TOKEN,
  NATIVE_TOKEN_ADDRESS,
  TokenInfo,
  ZIndex,
} from "../../constants";
import SelectCurrency from "../SelectCurrency";
import { EIP1193Provider } from "@web3-onboard/core";
import { useActiveWeb3, Web3Provider } from "../../hooks/useWeb3Provider";
import useSwap from "../../hooks/useSwap";
import { defaultTokenList } from "../../constants/tokens";
import useTokenBalances from "../../hooks/useTokenBalances";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import useApproval, { APPROVAL_STATE } from "../../hooks/useApproval";
import { useContract } from "../../hooks/useContract";

const injected = injectedModule();
// initialize Onboard
init({
  wallets: [injected],
  chains: [
    {
      id: "0x89",
      token: "MATIC",
      label: "Polygon",
      rpcUrl: "https://polygon.kyberengineering.io",
    },
  ],
});

export const DialogWrapper = styled.div`
  background-color: ${({ theme }) => theme.bg1};
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
  font-size: 1.125rem;
  :hover {
    opacity: 0.8;
  }

  > svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const SelectTokenText = styled.div`
  font-size: 16px;
  width: max-content;
`;
enum ModalType {
  SETTING = "setting",
  CURRENCY_IN = "currency_in",
  CURRENCY_OUT = "currency_out",
  REVIEW = "review",
}

interface Token {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

export interface WidgetProps {
  provider?: EIP1193Provider | providers.JsonRpcProvider;
  tokenList?: Token[];
}

const Widget = () => {
  const [showModal, setShowModal] = useState<ModalType | null>(null);
  const { provider, chainId, account } = useActiveWeb3();
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
  } = useSwap();
  const { balances } = useTokenBalances(
    defaultTokenList.map((item) => item.address)
  );

  const tokenInInfo =
    tokenIn === NATIVE_TOKEN_ADDRESS
      ? NATIVE_TOKEN[chainId]
      : defaultTokenList.find((item) => item.address === tokenIn);

  const tokenOutInfo =
    tokenOut === NATIVE_TOKEN_ADDRESS
      ? NATIVE_TOKEN[chainId]
      : defaultTokenList.find((item) => item.address === tokenOut);

  const amountOut = trade?.outputAmount
    ? formatUnits(trade.outputAmount, tokenOutInfo?.decimals).toString()
    : "";

  const tokenInBalance = balances[tokenIn] || BigNumber.from(0);
  const tokenOutBalance = balances[tokenOut] || BigNumber.from(0);

  const formattedTokenInBalance = parseFloat(
    parseFloat(
      formatUnits(tokenInBalance, tokenInInfo?.decimals || 18)
    ).toPrecision(10)
  );

  const formattedTokenOutBalance = parseFloat(
    parseFloat(
      formatUnits(tokenOutBalance, tokenOutInfo?.decimals || 18)
    ).toPrecision(10)
  );

  const modalTitle = (() => {
    switch (showModal) {
      case ModalType.SETTING:
        return "Settings";
      case ModalType.CURRENCY_IN:
        return "Select a token";
      case ModalType.CURRENCY_OUT:
        return "Select a token";
      default:
        return null;
    }
  })();

  const modalContent = (() => {
    switch (showModal) {
      case ModalType.SETTING:
        return <div onClick={() => setShowModal(null)}>xxx</div>;
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
    trade?.routerAddress
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
            <MaxHalfBtn>Max</MaxHalfBtn>
            <MaxHalfBtn>Half</MaxHalfBtn>
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
            <img
              width="20"
              height="20"
              src={tokenInInfo?.logoURI}
              style={{ borderRadius: "50%" }}
            />
            <div style={{ marginLeft: "0.375rem" }}>{tokenInInfo?.symbol}</div>
            <DropdownIcon />
          </SelectTokenBtn>
        </InputRow>
      </InputWrapper>

      <MiddleRow>
        <div></div>

        <SwitchBtn>
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
            const estimateGasOption = {
              from: account,
              to: trade?.routerAddress,
              data: trade?.encodedSwapData,
              value: BigNumber.from(
                tokenIn === NATIVE_TOKEN_ADDRESS ? trade?.inputAmount : 0
              ),
            };

            const gasEstimated = await provider
              ?.getSigner()
              .sendTransaction(estimateGasOption);
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

export default ({ provider, tokenList }: WidgetProps) => {
  const [{ wallet }, connect, disconnect] = useConnectWallet();

  // create an ethers provider
  let ethersProvider;

  if (wallet) {
    console.log(wallet);

    ethersProvider = new ethers.providers.Web3Provider(wallet.provider, "any");
  }

  return (
    <StrictMode>
      <ThemeProvider theme={darkTheme}>
        <Web3Provider provider={ethersProvider || null}>
          <Widget />
        </Web3Provider>
      </ThemeProvider>
      <Button onClick={() => (wallet ? disconnect(wallet) : connect())}>
        {wallet ? "Disconnect Wallet" : "Connect Wallet"}
      </Button>
    </StrictMode>
  );
};
