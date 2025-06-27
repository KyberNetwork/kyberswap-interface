import { cn } from "@kyber/utils/tailwind-helpers";

export default function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  const { className, ...rest } = props;

  return (
    <input
      className={cn(
        "border-none outline-none bg-inputBackground text-[var(--pcs-lw-text)] rounded-md w-full py-2 px-4 leading-6 placeholder-textSecondary",
        className
      )}
      {...rest}
    />
  );
}
