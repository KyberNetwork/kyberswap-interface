import { ReactNode } from "react";
import { useWidgetContext } from "@/stores/widget";

export function InfoBox({
  message,
  icon,
}: {
  message?: ReactNode;
  icon: ReactNode;
}) {
  const theme = useWidgetContext((s) => s.theme);
  return (
    <div style={{ height: "100%", justifyContent: "center" }}>
      {icon}
      {message && (
        <div
          style={{
            fontWeight: "700",
            fontSize: "20px",
            textAlign: "center",
            paddingTop: "4px",
            color: theme.subText,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
