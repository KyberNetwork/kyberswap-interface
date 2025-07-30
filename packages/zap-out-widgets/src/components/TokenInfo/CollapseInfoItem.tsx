import { ReactNode, useState } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@kyber/ui';

import IconAlertOctagon from '@/assets/svg/alert-octagon.svg';
import Loader from '@/components/Loader';
import { ItemData, RISKY_THRESHOLD, WarningType, isItemRisky } from '@/components/TokenInfo/utils';

const CollapseInfoItem = ({
  icon,
  title,
  warning,
  danger,
  loading,
  data,
  totalRisk,
  totalWarning,
}: {
  warning: number;
  danger: number;
  title: string;
  icon: ReactNode;
  loading: boolean;
  data: ItemData[];
  totalRisk: number;
  totalWarning: number;
}) => {
  const [expanded, setExpanded] = useState(true);

  const onExpand = () => setExpanded(prev => !prev);

  return (
    <Accordion type="single" collapsible className="w-full" value={expanded ? 'item-1' : ''}>
      <AccordionItem value="item-1">
        <AccordionTrigger
          className={`px-4 py-3 bg-black text-sm text-subText rounded-md ${expanded ? 'rounded-b-none' : ''}`}
          onClick={onExpand}
        >
          <div className="flex items-center justify-between w-full pr-3">
            <div className="flex items-center justify-start gap-[6px]">
              <span>{icon}</span>
              <span>{title}</span>
            </div>
            {(warning > 0 || danger > 0) && (
              <div className={`flex items-center gap-1 ${warning > 0 ? 'text-warning' : 'text-error'}`}>
                <IconAlertOctagon className="h-4 w-4" />
                {warning > 0 ? warning : danger}
              </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 py-4 bg-black bg-opacity-[0.2] rounded-b-md flex gap-3 justify-between flex-wrap">
          <div className="flex items-center gap-[6px] justify-between basis-[45%] text-xs text-subText">
            <div className="flex items-center gap-[6px]">
              <IconAlertOctagon className="h-4 w-4 text-error" />
              <span>{totalRisk <= 1 ? 'Risky Item' : 'Risky Item(s)'}</span>
            </div>
            <span className="text-error font-medium">{totalRisk}</span>
          </div>

          <div className="flex items-center gap-[6px] justify-between basis-[45%] text-xs text-subText">
            <div className="flex items-center gap-[6px]">
              <IconAlertOctagon className="h-4 w-4 text-warning" />
              <span>{totalWarning <= 1 ? 'Attention Item' : 'Attention Item(s)'}</span>
            </div>
            <span className="text-warning font-medium">{totalWarning}</span>
          </div>

          {data.map(item => {
            const { label, value, type, isNumber } = item;

            const colorRiskyByType = type === WarningType.RISKY ? 'text-error' : 'text-warning';
            const colorRiskyByAmount = Number(value) > RISKY_THRESHOLD.RISKY ? 'text-error' : 'text-warning';
            const displayValue = loading ? (
              <Loader className="animate-spin w-[10px] h-[10px]" />
            ) : isNumber && value ? (
              `${+value * 100}%`
            ) : value === '0' ? (
              `No`
            ) : value === '1' ? (
              `Yes`
            ) : isNumber ? (
              `Unknown`
            ) : (
              '--'
            );

            return (
              <div key={label} className="flex items-center gap-[6px] justify-between basis-[45%] text-xs text-subText">
                <span>{label}</span>
                <span
                  className={`font-medium ${
                    isItemRisky(item)
                      ? isNumber
                        ? colorRiskyByAmount
                        : colorRiskyByType
                      : displayValue === '--'
                        ? 'text-subText'
                        : 'text-accent'
                  }`}
                >
                  {displayValue}
                </span>
              </div>
            );
          })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default CollapseInfoItem;
