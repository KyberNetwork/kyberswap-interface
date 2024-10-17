import type { Config } from "tailwindcss";

// We want each package to be responsible for its own content.
const config: Omit<Config, "content"> = {
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
        border: "var(--ks-lw-stroke)",
        input: "var(--ks-lw-layer2)",
        background: "var(--ks-lw-layer1)",
        subText: "var(--ks-lw-subText)",
        text: "var(--ks-lw-text)",
        warning: {
          DEFAULT: "var(--ks-lw-warning)",
          200: "#ff990133",
        },
        error: "var(--ks-lw-error)",
        stroke: "var(--ks-lw-stroke)",
        layer1: "var(--ks-lw-layer1)",
        layer2: "var(--ks-lw-layer2)",
        dialog: "var(--ks-lw-dialog)",
        chartRange: "var(--ks-lw-chart-range)",
        chartArea: "var(--ks-lw-chart-area)",
        succuss: "var(--ks-lw-success)",
        primary: {
          DEFAULT: "var(--ks-lw-accent)",
        },
        icon: {
          DEFAULT: "var(--ks-lw-icons)",
        },
        accent: {
          DEFAULT: "var(--ks-lw-accent)",
        },
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        lg: "calc(var(--ks-lw-borderRadius) + 2px)",
        md: "var(--ks-lw-borderRadius)",
        sm: "calc(var(--ks-lw-borderRadius) - 2px)",
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
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
