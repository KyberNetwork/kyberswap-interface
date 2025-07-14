import { ChangeEvent, MouseEvent, useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { NATIVE_TOKEN_ADDRESS, Token, defaultToken } from '@kyber/schema';
import { Button, Input } from '@kyber/ui';
import { fetchTokenInfo } from '@kyber/utils';
import { formatUnits, isAddress } from '@kyber/utils/crypto';
import { formatWei } from '@kyber/utils/number';

import Check from '@/assets/svg/check.svg';
import Info from '@/assets/svg/info.svg';
import defaultTokenLogo from '@/assets/svg/question.svg?url';
import IconSearch from '@/assets/svg/search.svg';
import TrashIcon from '@/assets/svg/trash.svg';
import X from '@/assets/svg/x.svg';
import UserPositions from '@/components/TokenSelector/UserPositions';
import { MAX_ZAP_IN_TOKENS } from '@/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useTokenStore } from '@/stores/useTokenStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export enum TOKEN_SELECT_MODE {
  SELECT = 'SELECT',
  ADD = 'ADD',
}

export enum TOKEN_TAB {
  ALL,
  IMPORTED,
}

enum MODAL_TAB {
  TOKENS,
  POSITIONS,
}

interface CustomizeToken extends Token {
  balance: string;
  balanceToSort: string;
  selected: number;
  inPair: number;
  disabled: boolean;
}

const MESSAGE_TIMEOUT = 4_000;
let messageTimeout: ReturnType<typeof setTimeout>;

export default function TokenSelector({
  selectedTokenAddress,
  mode,
  selectedTokens,
  setSelectedTokens,
  setTokenToShow,
  setTokenToImport,
  onClose,
}: {
  selectedTokenAddress?: string;
  mode: TOKEN_SELECT_MODE;
  selectedTokens: Token[];
  setSelectedTokens: (tokens: Token[]) => void;
  setTokenToShow: (token: Token) => void;
  setTokenToImport: (token: Token) => void;
  onClose: () => void;
}) {
  const { theme, onOpenZapMigration, chainId } = useWidgetStore(
    useShallow(s => ({
      theme: s.theme,
      onOpenZapMigration: s.onOpenZapMigration,
      chainId: s.chainId,
    })),
  );
  const pool = usePoolStore(s => s.pool);
  const { importedTokens, tokens, removeImportedToken } = useTokenStore(
    useShallow(s => ({
      importedTokens: s.importedTokens,
      tokens: s.tokens,
      removeImportedToken: s.removeImportedToken,
    })),
  );
  const { balanceTokens, tokensIn, setTokensIn, amountsIn, setAmountsIn } = useZapState();

  const initializing = pool === 'loading';
  const allTokens = useMemo(() => [...tokens, ...importedTokens], [tokens, importedTokens]);

  const { address: token0Address } = initializing ? defaultToken : pool.token0;
  const { address: token1Address } = initializing ? defaultToken : pool.token1;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [unImportedTokens, setUnImportedTokens] = useState<Token[]>([]);
  const [tabSelected, setTabSelected] = useState<TOKEN_TAB>(TOKEN_TAB.ALL);
  const [modalTabSelected, setModalTabSelected] = useState<MODAL_TAB>(MODAL_TAB.TOKENS);
  const [message, setMessage] = useState<string>('');
  const [modalTokensIn, setModalTokensIn] = useState<Token[]>([...tokensIn]);
  const [modalAmountsIn, setModalAmountsIn] = useState(amountsIn);

  const modalTokensInAddress = useMemo(
    () => modalTokensIn.map((token: Token) => token.address?.toLowerCase()),
    [modalTokensIn],
  );

  const listTokens = useMemo(
    () =>
      (tabSelected === TOKEN_TAB.ALL ? allTokens : importedTokens)
        .map((token: Token) => {
          const foundTokenSelected = tokensIn.find(
            (tokenIn: Token) => tokenIn.address.toLowerCase() === token.address.toLowerCase(),
          );
          const balanceInWei =
            balanceTokens[
              token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
                ? NATIVE_TOKEN_ADDRESS.toLowerCase()
                : token.address.toLowerCase()
            ]?.toString() || '0';

          return {
            ...token,
            balance: formatWei(balanceInWei, token?.decimals),
            balanceToSort: formatUnits(balanceInWei, token?.decimals),
            disabled:
              mode === TOKEN_SELECT_MODE.ADD ||
              !foundTokenSelected ||
              foundTokenSelected.address === selectedTokenAddress
                ? false
                : true,
            selected:
              tokensIn.find((tokenIn: Token) => tokenIn.address.toLowerCase() === token.address.toLowerCase()) ||
              selectedTokens.find((tokenIn: Token) => tokenIn.address.toLowerCase() === token.address.toLowerCase())
                ? 1
                : 0,
            inPair:
              token.address.toLowerCase() === token0Address.toLowerCase()
                ? 2
                : token.address.toLowerCase() === token1Address.toLowerCase()
                  ? 1
                  : 0,
          };
        })
        .sort((a: CustomizeToken, b: CustomizeToken) => parseFloat(b.balanceToSort) - parseFloat(a.balanceToSort))
        .sort((a: CustomizeToken, b: CustomizeToken) => b.inPair - a.inPair)
        .sort((a: CustomizeToken, b: CustomizeToken) => b.selected - a.selected),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      tabSelected,
      allTokens,
      importedTokens,
      tokensIn,
      // balanceTokens,
      mode,
      selectedTokenAddress,
      token0Address,
      token1Address,
    ],
  );

  const filteredTokens = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return listTokens.filter(
      (item: CustomizeToken) =>
        item.name?.toLowerCase().includes(search) ||
        item.symbol?.toLowerCase().includes(search) ||
        item.address?.toLowerCase().includes(search),
    );
  }, [listTokens, searchTerm]);

  const handleClickToken = (newToken: CustomizeToken) => {
    if (mode === TOKEN_SELECT_MODE.SELECT) {
      const index = tokensIn.findIndex((token: Token) => token.address === selectedTokenAddress);
      if (index > -1) {
        const clonedTokensIn = [...tokensIn];
        clonedTokensIn[index] = newToken;
        setTokensIn(clonedTokensIn);

        const listAmountsIn = amountsIn.split(',');
        listAmountsIn[index] = '';
        setAmountsIn(listAmountsIn.join(','));

        onClose();
      }
    } else {
      const index = modalTokensIn.findIndex(
        (token: Token) => token.address === newToken.address || token.address.toLowerCase() === newToken.address,
      );
      if (index > -1) {
        const clonedModalTokensIn = [...modalTokensIn];
        clonedModalTokensIn.splice(index, 1);
        setModalTokensIn(clonedModalTokensIn);

        setSelectedTokens(clonedModalTokensIn);

        const listModalAmountsIn = modalAmountsIn.split(',');
        listModalAmountsIn.splice(index, 1);
        setModalAmountsIn(listModalAmountsIn.join(','));
      } else if (modalTokensIn.length < MAX_ZAP_IN_TOKENS) {
        const clonedModalTokensIn = [...modalTokensIn];
        clonedModalTokensIn.push(newToken);
        setModalTokensIn(clonedModalTokensIn);
        setSelectedTokens(clonedModalTokensIn);
        setModalAmountsIn(`${modalAmountsIn},`);
      } else {
        setMessage(
          'You have reached the maximum token selection limit. Please deselect one or more tokens to make changes.',
        );
      }
    }
  };

  const handleSaveSelected = () => {
    if (mode === TOKEN_SELECT_MODE.ADD) {
      setTokensIn(modalTokensIn);
      setAmountsIn(modalAmountsIn);

      onClose();
    }
  };

  const handleChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (unImportedTokens.length) setUnImportedTokens([]);
  };

  const handleRemoveImportedToken = (e: MouseEvent<SVGSVGElement>, token: Token) => {
    e.stopPropagation();

    const index = tokensIn.findIndex((tokenIn: Token) => tokenIn.address === token.address);

    if (index > -1) {
      if (tokensIn.length === 1) {
        setMessage('You cannot remove the only selected token, please select another token first.');
        return;
      }

      const clonedTokensIn = [...tokensIn];
      const listAmountsIn = amountsIn.split(',');
      clonedTokensIn.splice(index, 1);
      listAmountsIn.splice(index, 1);
      setTokensIn(clonedTokensIn);
      setAmountsIn(listAmountsIn.join(','));
      setSelectedTokens(clonedTokensIn);
      removeImportedToken(token);

      if (token.address === selectedTokenAddress && mode === TOKEN_SELECT_MODE.SELECT) onClose();

      return;
    }

    removeImportedToken(token);
  };

  const handleShowTokenInfo = (e: MouseEvent<SVGSVGElement>, token: Token) => {
    e.stopPropagation();
    setTokenToShow(token);
  };

  const handleImportToken = (token: Token) => {
    // if (
    //   mode === TOKEN_SELECT_MODE.ADD &&
    //   modalTokensIn.length >= MAX_ZAP_IN_TOKENS
    // ) {
    //   setMessage(
    //     "You have reached the maximum token selection limit. Please deselect one or more tokens to make changes."
    //   );
    //   return;
    // }
    setTokenToImport(token);
  };

  useEffect(() => {
    if (message) {
      if (messageTimeout) clearTimeout(messageTimeout);
      messageTimeout = setTimeout(() => setMessage(''), MESSAGE_TIMEOUT);
    }

    return () => {
      clearTimeout(messageTimeout);
    };
  }, [message]);

  useEffect(() => {
    if (unImportedTokens?.length) {
      const cloneUnImportedTokens = [...unImportedTokens].filter(
        token => !importedTokens.find(importedToken => importedToken.address === token.address),
      );
      setUnImportedTokens(cloneUnImportedTokens);
      setSearchTerm('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importedTokens]);

  useEffect(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!filteredTokens.length && isAddress(search)) {
      fetchTokenInfo(search, chainId).then(res => {
        setUnImportedTokens(res);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTokens]);

  useEffect(() => {
    const cloneTokensIn = [...tokensIn];
    const cloneAmountsIn = amountsIn.split(',');

    selectedTokens.forEach((token: Token) => {
      if (!cloneTokensIn.find((tokenIn: Token) => tokenIn.address.toLowerCase() === token.address.toLowerCase())) {
        cloneTokensIn.push(token);
        cloneAmountsIn.push('');
      }
    });

    setModalTokensIn(cloneTokensIn);
    setModalAmountsIn(cloneAmountsIn.join(','));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokensIn, amountsIn]);

  if (initializing) return null;

  return (
    <div className="w-full mx-auto text-white overflow-hidden">
      <div className="space-y-4">
        <div className="flex justify-between items-center p-6 pb-0">
          <h2 className="text-xl">Select Liquidity Source</h2>
          <div className="text-subText hover:text-white cursor-pointer" onClick={onClose}>
            <X className="h-6 w-6" />
          </div>
        </div>

        {onOpenZapMigration && (
          <div
            className="border rounded-full p-[2px] flex mx-6 text-sm gap-1"
            style={{ borderColor: `${theme.icons}33` }}
          >
            <div
              className={`rounded-full w-full text-center py-2 cursor-pointer hover:bg-[#ffffff33] ${
                modalTabSelected === MODAL_TAB.TOKENS ? 'bg-[#ffffff33]' : ''
              }`}
              onClick={() => setModalTabSelected(MODAL_TAB.TOKENS)}
            >
              Token(s)
            </div>
            <div
              className={`rounded-full w-full text-center py-2 cursor-pointer hover:bg-[#ffffff33] ${
                modalTabSelected === MODAL_TAB.POSITIONS ? 'bg-[#ffffff33]' : ''
              }`}
              onClick={() => setModalTabSelected(MODAL_TAB.POSITIONS)}
            >
              Your Position(s)
            </div>
          </div>
        )}

        {mode === TOKEN_SELECT_MODE.SELECT && modalTabSelected === MODAL_TAB.TOKENS && (
          <p className="text-sm text-subText px-6">
            You can search and select <span className="text-text">any token(s)</span> on KyberSwap
          </p>
        )}

        {modalTabSelected === MODAL_TAB.POSITIONS && (
          <p className="text-sm text-subText px-6">
            Use your existing liquidity positions from supported protocols as a source.
          </p>
        )}

        <div className={`px-6 ${modalTabSelected === MODAL_TAB.POSITIONS ? '!mb-2' : ''}`}>
          <div className="relative border-0">
            <Input
              type="text"
              placeholder="Search by token name, token symbol or address"
              className="h-[45px] pl-4 pr-10 py-2 bg-[#0f0f0f] border-[1.5px] border-[#0f0f0f] text-white placeholder-subText rounded-full focus:border-success outline-none"
              value={searchTerm}
              onChange={handleChangeSearch}
            />
            <IconSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-subText h-[18px]" />
          </div>
        </div>

        {mode === TOKEN_SELECT_MODE.ADD && modalTabSelected === MODAL_TAB.TOKENS && (
          <p className="text-sm text-subText px-6">The maximum number of tokens selected is {MAX_ZAP_IN_TOKENS}.</p>
        )}

        {modalTabSelected === MODAL_TAB.TOKENS && (
          <TokenFeature
            tabSelected={tabSelected}
            mode={mode}
            selectedTokenAddress={selectedTokenAddress}
            setTabSelected={setTabSelected}
            setMessage={setMessage}
            setSelectedTokens={setSelectedTokens}
            onClose={onClose}
          />
        )}

        <div className={`!mt-0 ${modalTabSelected === MODAL_TAB.TOKENS ? 'h-[280px]' : 'h-[356px]'} overflow-y-auto`}>
          {modalTabSelected === MODAL_TAB.TOKENS && (
            <>
              {tabSelected === TOKEN_TAB.ALL &&
                unImportedTokens.map((token: Token, index) => (
                  <div
                    key={`${token.symbol}-${index}`}
                    className="flex items-center justify-between py-2 px-6 text-red"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        className="h-6 w-6"
                        src={token.logo}
                        alt=""
                        onError={({ currentTarget }) => {
                          currentTarget.onerror = null;
                          currentTarget.src = defaultTokenLogo;
                        }}
                      />
                      <p className="ml-2 text-subText">{token.symbol}</p>
                      <p className="text-xs text-[#6C7284]">{token.name}</p>
                    </div>
                    <Button
                      className="rounded-full !bg-accent font-normal !text-[#222222] px-3 py-[6px] h-fit hover:brightness-75"
                      onClick={() => handleImportToken(token)}
                    >
                      Import
                    </Button>
                  </div>
                ))}

              {filteredTokens?.length > 0 && !unImportedTokens.length ? (
                filteredTokens.map((token: CustomizeToken, index) => (
                  <div
                    key={`${token.symbol}-${index}`}
                    className={`flex items-center justify-between py-2 px-6 cursor-pointer hover:bg-[#0f0f0f] ${
                      mode === TOKEN_SELECT_MODE.SELECT &&
                      token.address?.toLowerCase() === selectedTokenAddress?.toLowerCase()
                        ? 'bg-[#1d7a5f26]'
                        : ''
                    } ${token.disabled ? '!bg-stroke !cursor-not-allowed brightness-50' : ''}`}
                    onClick={() => !token.disabled && handleClickToken(token)}
                  >
                    <div className="flex items-center space-x-3">
                      {mode === TOKEN_SELECT_MODE.ADD && (
                        <div
                          className={`w-4 h-4 rounded-[4px] flex items-center justify-center cursor-pointer mr-1 ${
                            modalTokensInAddress.includes(token.address?.toLowerCase())
                              ? 'bg-emerald-400'
                              : 'bg-gray-700'
                          }`}
                        >
                          {modalTokensInAddress.includes(token.address?.toLowerCase()) && (
                            <Check className="h-3 w-3 text-black" />
                          )}
                        </div>
                      )}
                      <img
                        className="h-6 w-6"
                        src={token.logo ? token.logo : defaultTokenLogo}
                        alt=""
                        onError={({ currentTarget }) => {
                          currentTarget.onerror = null;
                          currentTarget.src = defaultTokenLogo;
                        }}
                      />
                      <div>
                        <p className="leading-6">{token.symbol}</p>
                        <p className={`${tabSelected === TOKEN_TAB.ALL ? 'text-xs' : ''} text-subText`}>
                          {tabSelected === TOKEN_TAB.ALL ? token.name : token.balance}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      {tabSelected === TOKEN_TAB.ALL ? (
                        <span>{token.balance}</span>
                      ) : (
                        <TrashIcon
                          className="w-[18px] text-subText hover:text-text !cursor-pointer"
                          onClick={e => handleRemoveImportedToken(e, token)}
                        />
                      )}
                      <Info
                        className="w-[18px] h-[18px] text-subText hover:text-text !cursor-pointer"
                        onClick={e => handleShowTokenInfo(e, token)}
                      />
                    </div>
                  </div>
                ))
              ) : !unImportedTokens.length || (tabSelected === TOKEN_TAB.IMPORTED && !importedTokens.length) ? (
                <div className="text-center text-[#6C7284] font-medium mt-4">No results found.</div>
              ) : (
                <></>
              )}
            </>
          )}

          {modalTabSelected === MODAL_TAB.POSITIONS && <UserPositions search={searchTerm} />}
        </div>

        {message && (
          <div
            className={`text-warning bg-warning-200 py-3 px-4 mt-2 text-xs mx-6 rounded-md transition-all ease-in-out duration-300`}
          >
            {message}
          </div>
        )}

        {mode === TOKEN_SELECT_MODE.ADD && modalTabSelected === MODAL_TAB.TOKENS && (
          <div className="flex space-x-4 rounded-lg px-4">
            <Button
              variant="outline"
              className="flex-1 !bg-transparent text-subText border-subText rounded-full hover:text-accent hover:border-accent"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 !bg-accent text-black rounded-full hover:text-black hover:brightness-110"
              disabled={!modalTokensIn.length}
              onClick={handleSaveSelected}
            >
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const TokenFeature = ({
  tabSelected,
  mode,
  selectedTokenAddress,
  setTabSelected,
  setMessage,
  setSelectedTokens,
  onClose,
}: {
  tabSelected: TOKEN_TAB;
  mode: TOKEN_SELECT_MODE;
  selectedTokenAddress?: string;
  setTabSelected: (tab: TOKEN_TAB) => void;
  setMessage: (message: string) => void;
  setSelectedTokens: (tokens: Token[]) => void;
  onClose: () => void;
}) => {
  const { tokensIn, setTokensIn, amountsIn, setAmountsIn } = useZapState();
  const { importedTokens, removeAllImportedTokens } = useTokenStore();

  const handleRemoveAllImportedToken = () => {
    if (
      tokensIn.find((tokenIn: Token) => importedTokens.find(importedToken => tokenIn.address === importedToken.address))
    ) {
      if (tokensIn.length === 1) {
        setMessage('You cannot remove the only selected token, please select another token first.');
        return;
      }

      const clonedTokensIn: (Token | null)[] = [...tokensIn];
      const listAmountsIn: (string | null)[] = amountsIn.split(',');

      for (let i = 0; i < clonedTokensIn.length; i++) {
        if (importedTokens.find(importedToken => importedToken.address === clonedTokensIn[i]?.address)) {
          clonedTokensIn[i] = null;
          listAmountsIn[i] = null;
        }
      }

      const removedTokensIn = clonedTokensIn.filter(token => token !== null);
      const removedAmountsIn = listAmountsIn.filter(amount => amount !== null);
      setTokensIn(removedTokensIn as Token[]);
      setAmountsIn(removedAmountsIn.join(','));

      setSelectedTokens(removedTokensIn as Token[]);

      const needClose =
        mode === TOKEN_SELECT_MODE.SELECT &&
        importedTokens.find(importedToken => importedToken.address === selectedTokenAddress);
      removeAllImportedTokens();

      if (needClose) onClose();

      return;
    }

    removeAllImportedTokens();
  };

  return (
    <>
      <div className="px-6 pb-3 flex gap-4 border-b border-[#505050]">
        <div
          className={`text-sm cursor-pointer ${tabSelected === TOKEN_TAB.ALL ? 'text-accent' : ''}`}
          onClick={() => setTabSelected(TOKEN_TAB.ALL)}
        >
          All
        </div>
        <div
          className={`text-sm cursor-pointer ${tabSelected === TOKEN_TAB.IMPORTED ? 'text-accent' : ''}`}
          onClick={() => setTabSelected(TOKEN_TAB.IMPORTED)}
        >
          Imported
        </div>
      </div>

      {tabSelected === TOKEN_TAB.IMPORTED && importedTokens.length ? (
        <div className="flex items-center justify-between px-6 !mt-0 py-[10px]">
          <span className="text-xs text-icon">{importedTokens.length} Custom Tokens</span>
          <Button
            className="rounded-full !text-icon flex items-center gap-2 text-xs px-[10px] py-[5px] h-fit font-normal !bg-[#a9a9a933]"
            onClick={handleRemoveAllImportedToken}
          >
            <TrashIcon className="w-[13px] h-[13px]" />
            Clear All
          </Button>
        </div>
      ) : null}
    </>
  );
};
