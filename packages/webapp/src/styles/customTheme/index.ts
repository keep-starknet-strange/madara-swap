import { extendTheme } from "@chakra-ui/react";
import type { Styles } from "@chakra-ui/theme-tools";

import colors from "./colors";
import Button from "./components/button";
import Input from "./components/input";
import Menu from "./components/menu";
import Modal from "./components/modal";
import Popover from "./components/popover";
import Slider from "./components/slider";
import Table from "./components/table";
import Tabs from "./components/tabs";
import Tooltip from "./components/tooltip";
import fonts from "./fonts";

const globalStyles: Styles = {
  global: () => ({
    body: {
      color: "whiteAlpha.900",
      fontFeatureSettings: "'ss01' on,'ss02' on,'cv01' on,'cv03' on",
      fontVariant: "none !important",
      bg: "black",
      button: {
        // button breaking with globals variants(see: https://webkit.org/blog/28/buttons/)
        fontVariant: "none !important",
      },
      // get-starknet modal styled
      ".s-overlay__scrim": {
        backgroundColor: "black !important",
      },
      ".s-dialog": {
        ".s-dialog__content": {
          borderRadius: "md",
          boxShadow: "none !important",
          ".s-card": {
            bg: `${colors && colors.gray ? colors.gray["500"] : "inherit"}!important`,
            ".s-list": {
              ".s-list-item": {
                bg: `${colors && colors.gray ? colors.gray["900"] : "inherit"}!important`,
                borderRadius: "md",
              },
            },
          },
        },
      },
    },
  }),
};
const customTheme = extendTheme({
  initialColorMode: "dark",
  useSystemColorMode: false,
  fonts,
  colors,
  styles: globalStyles,
  components: {
    Button,
    Modal,
    Popover,
    Input,
    Table,
    Menu,
    Tabs,
    Slider,
    Tooltip,
  },
});

export default customTheme;
