import { useMemo } from 'react';

import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema';
import { Skeleton, TokenLogo } from '@kyber/ui';
import { formatDisplayNumber, formatUnits } from '@kyber/utils/number';

import DropdownIcon from '@/assets/svg/dropdown.svg';
import WalletIcon from '@/assets/svg/wallet.svg';
import X from '@/assets/svg/x.svg';
import { useZapState } from '@/hooks/useZapState';

export default function LiquidityToAdd({
  tokenIndex,
  setOpenTokenSelectModal,
  setTokenAddressSelected,
}: {
  tokenIndex: number;
  setOpenTokenSelectModal: (open: boolean) => void;
  setTokenAddressSelected: (address: string) => void;
}) {
  const { tokensIn, setTokensIn, amountsIn, setAmountsIn, tokenBalances, tokenPrices } = useZapState();

  const token = useMemo(() => tokensIn[tokenIndex], [tokensIn, tokenIndex]);
  const amount = useMemo(() => amountsIn.split(',')[tokenIndex] || '', [amountsIn, tokenIndex]);

  const usdAmount = useMemo(
    () => tokenPrices[token.address.toLowerCase()] * parseFloat(amount || '0'),
    [tokenPrices, token.address, amount],
  );

  const balanceInWei = useMemo(
    () =>
      tokenBalances[
        token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NATIVE_TOKEN_ADDRESS.toLowerCase()
          : token.address.toLowerCase()
      ]?.toString() || '0',
    [tokenBalances, token],
  );

  const onChangeAmount = (e: any) => {
    const value = e.target.value.replace(/,/g, '.');
    if (value === '.') return;
    const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
    if (value === '' || inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) {
      onChangeTokenAmount(value);
    }
  };

  const onChangeTokenAmount = (newAmount: string | number) => {
    const listAmountsIn = amountsIn.split(',');
    listAmountsIn[tokenIndex] = newAmount.toString();
    setAmountsIn(listAmountsIn.join(','));
  };

  const onOpenTokenSelectModal = () => {
    setOpenTokenSelectModal(true);
    setTokenAddressSelected(token.address);
  };

  const onClickRemoveToken = () => {
    const cloneTokensIn = [...tokensIn];
    cloneTokensIn.splice(tokenIndex, 1);
    setTokensIn(cloneTokensIn);

    const listAmountsIn = amountsIn.split(',');
    listAmountsIn.splice(tokenIndex, 1);
    setAmountsIn(listAmountsIn.join(','));
  };

  return (
    <div className="mt-4 border border-stroke rounded-md p-3 brightness-85 bg-layer2 relative">
      <div className="flex justify-between text-subText text-sm font-medium">
        <div className="flex items-center gap-[6px]">
          <button
            className="rounded-full outline-inherit cursor-pointer items-center flex gap-1 hover:brightness-150 active:scale-95 py-[2px] px-2 text-xs bg-transparent border-[1.8px] border-solid border-stroke font-normal text-subText brightness-150"
            onClick={() => {
              if (balanceInWei) onChangeTokenAmount(formatUnits(BigInt(balanceInWei).toString(), token?.decimals));
            }}
          >
            Max
          </button>
          <button
            className="rounded-full outline-inherit cursor-pointer items-center flex gap-1 hover:brightness-150 active:scale-95 py-[2px] px-2 text-xs bg-transparent border-[1.8px] border-solid border-stroke font-normal text-subText brightness-150"
            onClick={() => {
              if (balanceInWei)
                onChangeTokenAmount(formatUnits((BigInt(balanceInWei) / 2n).toString(), token.decimals));
            }}
          >
            Half
          </button>
        </div>

        <div
          className="flex items-center gap-[6px] cursor-pointer"
          onClick={() => {
            if (balanceInWei) onChangeTokenAmount(formatUnits(BigInt(balanceInWei).toString(), token?.decimals));
          }}
        >
          <WalletIcon />
          {formatUnits(balanceInWei, token?.decimals, 4) || ''}
        </div>
      </div>

      <div className="w-full flex mt-4 items-center gap-2">
        <div className="flex-1">
          <input
            value={amount}
            onChange={onChangeAmount}
            inputMode="decimal"
            autoComplete="off"
            autoCorrect="off"
            type="text"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0.0"
            minLength={1}
            maxLength={79}
            spellCheck="false"
            className="bg-transparent text-text text-xl font-medium w-full p-0 border-none outline-none"
          />
        </div>
        {!!usdAmount && (
          <div className="text-subText text-xs max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
            ~
            {formatDisplayNumber(usdAmount, {
              significantDigits: 6,
              style: 'currency',
            })}
          </div>
        )}
        <button
          className="bg-layer2 border-none rounded-full outline-inherit cursor-pointer py-[6px] px-3 items-center text-text brightness-150 flex gap-1 hover:brightness-150 active:scale-95"
          onClick={onOpenTokenSelectModal}
        >
          <TokenLogo src={token.logo} size={20} className="brightness-75" alt="TokenLogo" />
          <span>{token.symbol}</span>
          <DropdownIcon />
        </button>
      </div>

      {tokensIn.length > 1 ? (
        <div
          className="text-subText cursor-pointer hover:text-text w-fit absolute top-[-16px] right-[3px] brightness-75"
          onClick={onClickRemoveToken}
        >
          <X className="w-[14px] h-[14px]" />
        </div>
      ) : null}
    </div>
  );
}

export const LiquidityToAddSkeleton = () => {
  return (
    <div className="mt-4 border border-stroke rounded-md p-3 brightness-85 bg-layer2 relative">
      <div className="flex justify-between text-subText text-sm font-medium">
        <div className="flex items-center gap-[6px]">
          <button className="rounded-full outline-inherit cursor-pointer items-center flex gap-1 hover:brightness-150 active:scale-95 py-[2px] px-2 text-xs bg-transparent border-[1.8px] border-solid border-stroke font-normal text-subText brightness-150">
            Max
          </button>
          <button className="rounded-full outline-inherit cursor-pointer items-center flex gap-1 hover:brightness-150 active:scale-95 py-[2px] px-2 text-xs bg-transparent border-[1.8px] border-solid border-stroke font-normal text-subText brightness-150">
            Half
          </button>
        </div>

        <div className="flex items-center gap-[6px] cursor-pointer">
          <WalletIcon />
          <Skeleton className="w-16 h-5" />
        </div>
      </div>

      <div className="w-full flex mt-4 items-center gap-2">
        <div className="flex-1" />
        <Skeleton className="w-32 h-9" />
      </div>
    </div>
  );
};
