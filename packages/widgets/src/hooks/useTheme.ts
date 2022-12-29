import { Context, useContext } from "react";
import { ThemeContext } from "styled-components";
import { Theme } from "../theme";

export default function useTheme() {
  return useContext(ThemeContext as Context<Theme>);
}
