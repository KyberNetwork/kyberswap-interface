import { Input as KyberInput, InputProps } from "@kyber/ui/input";
import { cn } from "@kyber/utils/tailwind-helpers";

const Input = ({ className, ...props }: InputProps) => (
  <KyberInput
    className={cn(
      "rounded-[8px] bg-transparent focus-visible:border-[#fafafa] border-[#27272a] shadow-sm placeholder:text-[#ffffff66]",
      className
    )}
    {...props}
  />
);

export default Input;
