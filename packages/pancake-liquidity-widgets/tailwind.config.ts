import type { Config } from "tailwindcss";

const config: Pick<Config, "presets" | "content"> = {
  content: ["./src/**/*.tsx"],
  presets: [
    {
      theme: {
        container: {
          center: true,
          padding: "2rem",
          screens: {
            "2xl": "1400px",
          },
        },
        extend: {
          colors: {
            cardBackground: "var(--pcs-lw-cardBackground)",
            cardBorder: "var(--pcs-lw-cardBorder)",
            background: "var(--pcs-lw-background)",
            inputBackground: "var(--pcs-lw-inputBackground)",
            inputBorder: "var(--pcs-lw-inputBorder)",
            primary: "var(--pcs-lw-primary)",
            secondary: "var(--pcs-lw-secondary)",
            tertiary: "var(--pcs-lw-tertiary)",
            textSecondary: "var(--pcs-lw-textSecondary)",
            textPrimary: "var(--pcs-lw-textPrimary)",
            textReverse: "var(--pcs-lw-textReverse)",
            warningBackground: "var(--pcs-lw-warningBackground)",
            warningBorder: "var(--pcs-lw-warningBorder)",
            warning: "var(--pcs-lw-warning)",
            disabled: "var(--pcs-lw-disabled)",
            error: "var(--pcs-lw-error)",
            green10: "var(--pcs-lw-green-10)",
            green20: "var(--pcs-lw-green-20)",
            green50: "var(--pcs-lw-green-50)",
            foreground: "hsl(var(--foreground))",
          },
          borderRadius: {
            lg: "18px",
            md: "16px",
            sm: "14px",
          },
          keyframes: {
            "accordion-down": {
              from: {
                height: "0",
              },
              to: {
                height: "var(--radix-accordion-content-height)",
              },
            },
            "accordion-up": {
              from: {
                height: "var(--radix-accordion-content-height)",
              },
              to: {
                height: "0",
              },
            },
          },
          animation: {
            "accordion-down": "accordion-down 0.2s ease-out",
            "accordion-up": "accordion-up 0.2s ease-out",
          },
          brightness: {
            80: ".8",
            120: "1.2",
            130: "1.3",
            140: "1.4",
            150: "1.5",
          },
          scale: {
            96: ".96",
            99: ".99",
          },
          transitionDuration: {
            "2000": "2000ms",
          },
        },
      },
      plugins: [require("tailwindcss-animate")],
    },
  ],
};

export default config;
