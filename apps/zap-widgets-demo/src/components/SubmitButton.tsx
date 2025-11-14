import { Button, ButtonProps } from "@kyber/ui";
import { forwardRef } from "react";

const SubmitButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & { text?: string | React.ReactNode }
>(({ text, ...props }, ref) => {
  return (
    <Button
      className="rounded-[8px] !bg-[#fafafa] !text-[#18181b] hover:opacity-95"
      ref={ref}
      {...props}
    >
      {text || "Submit"}
    </Button>
  );
});

export default SubmitButton;
