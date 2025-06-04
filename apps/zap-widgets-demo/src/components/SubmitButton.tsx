import { Button, ButtonProps } from "@kyber/ui";
import { forwardRef } from "react";

const SubmitButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ ...props }, ref) => {
    return (
      <Button
        className="rounded-[8px] !bg-[#fafafa] text-[#18181b] hover:opacity-95"
        ref={ref}
        {...props}
      >
        Submit
      </Button>
    );
  }
);

export default SubmitButton;
