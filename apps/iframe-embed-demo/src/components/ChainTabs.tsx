import { cn } from "@kyber/utils/tailwind-helpers";

import { CHAINS } from "@/constants";

interface Props {
  value: number;
  onChange: (chainId: number) => void;
  className?: string;
}

const ChainTabs = ({ value, onChange, className }: Props) => {
  return (
    <div className={cn("inline-flex rounded-full border border-white/10 bg-[#151515] p-1", className)}>
      {CHAINS.map((chain) => (
        <button
          key={chain.id}
          type="button"
          onClick={() => onChange(chain.id)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm transition-colors",
            value === chain.id ? "bg-accent font-medium text-black" : "text-subText hover:text-text",
          )}
        >
          {chain.label}
        </button>
      ))}
    </div>
  );
};

export default ChainTabs;
