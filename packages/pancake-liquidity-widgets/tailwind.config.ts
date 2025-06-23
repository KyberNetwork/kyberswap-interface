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
            cardBackground: "var(--ks-lw-cardBackground)",
            cardBorder: "var(--ks-lw-cardBorder)",
            background: "var(--ks-lw-background)",
            inputBackground: "var(--ks-lw-inputBackground)",
            inputBorder: "var(--ks-lw-inputBorder)",
            primary: "var(--ks-lw-primary)",
            secondary: "var(--ks-lw-secondary)",
            tertiary: "var(--ks-lw-tertiary)",
            textSecondary: "var(--ks-lw-textSecondary)",
            textPrimary: "var(--ks-lw-textPrimary)",
            textReverse: "var(--ks-lw-textReverse)",
            warningBackground: "var(--ks-lw-warningBackground)",
            warningBorder: "var(--ks-lw-warningBorder)",
            warning: "var(--ks-lw-warning)",
            disabled: "var(--ks-lw-disabled)",
            error: "var(--ks-lw-error)",
            green10: "var(--ks-lw-green-10)",
            green20: "var(--ks-lw-green-20)",
            green50: "var(--ks-lw-green-50)",
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
