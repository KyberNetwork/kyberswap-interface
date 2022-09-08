import { StrictMode, useEffect, useState } from "react";
import styled, { keyframes, ThemeProvider } from "styled-components";
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
} from "./styled";

import { init, useConnectWallet } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import { ethers, providers } from "ethers";
import { ZIndex } from "../../constants";
import SelectCurrency from "../SelectCurrency";
import { EIP1193Provider } from "@web3-onboard/core";

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

enum ModalType {
  SETTING = "setting",
  CURRENCY = "currency",
  REVIEW = "review",
}

export interface WidgetProps {
  provider?: EIP1193Provider | providers.JsonRpcProvider;
}

const Widget = ({ provider }: WidgetProps) => {
  const [{ wallet, connecting }, connect, disconnect, updateBalances] =
    useConnectWallet();

  // create an ethers provider
  let ethersProvider;

  if (wallet) {
    console.log(wallet);

    ethersProvider = new ethers.providers.Web3Provider(wallet.provider, "any");
  }

  const [showModal, setShowModal] = useState<ModalType | null>(null);

  const modalTitle = (() => {
    switch (showModal) {
      case ModalType.SETTING:
        return "Settings";
      case ModalType.CURRENCY:
        return "Select a token";
      default:
        return null;
    }
  })();

  const modalContent = (() => {
    switch (showModal) {
      case ModalType.SETTING:
        return <div onClick={() => setShowModal(null)}>xxx</div>;
      case ModalType.CURRENCY:
        return <SelectCurrency />;
      default:
        return null;
    }
  })();

  return (
    <StrictMode>
      <ThemeProvider theme={darkTheme}>
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
                1.231231241
              </AccountBalance>
            </BalanceRow>

            <InputRow>
              <Input />
              <SelectTokenBtn onClick={() => setShowModal(ModalType.CURRENCY)}>
                <img
                  width="20"
                  height="20"
                  src="https://coin.top/production/logo/usdtlogo.png"
                />
                <div style={{ marginLeft: "0.375rem" }}>USDT</div>
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
                1.231231241
              </AccountBalance>
            </BalanceRow>

            <InputRow>
              <Input disabled />
              <SelectTokenBtn onClick={() => setShowModal(ModalType.CURRENCY)}>
                <img
                  width="20"
                  height="20"
                  src="https://coin.top/production/logo/usdtlogo.png"
                />
                <div style={{ marginLeft: "0.375rem" }}>USDT</div>
                <DropdownIcon />
              </SelectTokenBtn>
            </InputRow>
          </InputWrapper>

          <Button onClick={() => (wallet ? disconnect(wallet) : connect())}>
            {wallet ? "Disconnect Wallet" : "Connect Wallet"}
          </Button>
        </Wrapper>
      </ThemeProvider>
    </StrictMode>
  );
};

export default Widget;
