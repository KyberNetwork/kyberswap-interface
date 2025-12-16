import { univ3Types, univ4Types } from '@kyber/schema';

import Action from '@/components/Action';
import PoolStat from '@/components/Content/PoolStat';
import PriceInfo from '@/components/Content/PriceInfo';
import PriceInput from '@/components/Content/PriceInput';
import ZapSummary from '@/components/Content/ZapSummary';
import ErrorDialog from '@/components/ErrorDialog';
import Estimated from '@/components/Estimated';
import Header from '@/components/Header';
import LeftWarning from '@/components/LeftWarning';
import LiquidityChart from '@/components/LiquidityChart';
import LiquidityChartSkeleton from '@/components/LiquidityChart/LiquidityChartSkeleton';
import { PositionApr } from '@/components/PositionApr';
import { PositionFee } from '@/components/PositionFee';
import PositionLiquidity from '@/components/PositionLiquidity';
import PositionPriceRange from '@/components/PositionPriceRange';
import Preview from '@/components/Preview';
import PriceRange from '@/components/PriceRange';
import Setting from '@/components/Setting';
import TokenInput from '@/components/TokenInput';
import Warning from '@/components/Warning';
import useApproval from '@/hooks/useApproval';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { PriceType } from '@/types/index';

export default function Widget() {
  const { poolType, positionId } = useWidgetStore(['poolType', 'positionId']);
  const { pool } = usePoolStore(['pool']);
  const { getZapRoute, buildData, setBuildData } = useZapState();
  const approval = useApproval();

  const initializing = !pool;

  const isUniV3 = univ3Types.includes(poolType as any);
  const isUniv4 = univ4Types.includes(poolType);

  const onClosePreview = () => {
    if (isUniv4) {
      approval.nftApproval.check();
      approval.nftApprovalAll.check();
    }
    setBuildData(null);
    getZapRoute();
  };

  return (
    <div className="ks-lw ks-lw-style">
      <ErrorDialog />
      <Preview onDismiss={onClosePreview} />
      <div className={buildData ? 'hidden' : 'p-6'}>
        <Header />
        <div className="mt-5 flex gap-5 max-sm:flex-col">
          <div className="w-[55%] max-sm:w-full">
            <PoolStat />
            <PriceInfo />
            {!positionId && isUniV3 && (initializing ? <LiquidityChartSkeleton /> : <LiquidityChart />)}
            {positionId ? <PositionPriceRange /> : <PriceRange />}
            {!positionId ? (
              isUniV3 && (
                <div className="flex gap-4 w-full">
                  <PriceInput type={PriceType.MinPrice} />
                  <PriceInput type={PriceType.MaxPrice} />
                </div>
              )
            ) : (
              <>
                <PositionLiquidity />
                {isUniv4 && <PositionFee />}
              </>
            )}
            {!isUniV3 && <TokenInput className="mt-4" />}
            <PositionApr />
            <LeftWarning />
          </div>

          <div className="w-[45%] max-sm:w-full">
            {isUniV3 && <TokenInput />}
            <Estimated />
            <ZapSummary />
            <Warning />
          </div>
        </div>
        <Action approval={approval} />
      </div>
      <Setting />
    </div>
  );
}
