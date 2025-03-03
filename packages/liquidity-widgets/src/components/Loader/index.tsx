import { useWidgetContext } from "@/stores/widget";

export default function Loader({
  size = "16px",
  stroke,
  strokeWidth,
  ...rest
}: {
  size?: string;
  stroke?: string;
  strokeWidth?: number;
  [k: string]: unknown;
}) {
  const theme = useWidgetContext((s) => s.theme);

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      stroke={stroke}
      {...rest}
    >
      <path
        stroke={stroke || theme.accent}
        d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 9.27455 20.9097 6.80375 19.1414 5"
        strokeWidth={strokeWidth ?? "2.5"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
