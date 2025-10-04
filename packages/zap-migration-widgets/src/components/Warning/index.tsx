import FullRangeWarning from '@/components/Warning/FullRangeWarning';
import HoneypotWarning from '@/components/Warning/HoneypotWarning';
import OutRangeWarning from '@/components/Warning/OutRangeWarning';

export default function Warning() {
  return (
    <div className="flex flex-col gap-2">
      <OutRangeWarning />
      <FullRangeWarning />
      <HoneypotWarning />
    </div>
  );
}
