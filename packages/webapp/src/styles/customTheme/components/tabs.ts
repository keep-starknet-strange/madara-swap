import type { DeepPartial, Theme } from "@chakra-ui/react";

const Tabs: DeepPartial<Theme["components"]["Tabs"]> = {
  baseStyle: {
    tab: {
      _dark: {
        color: "whiteAlpha.600",
        borderRadius: "10px",
        /* _active: {
          background: "transparent",
        }, */
        _selected: {
          color: "whiteAlpha.900",
          background: "gray.900",
        },
        _focus: {
          outline: "none",
          boxShadow: "none",
        },
      },
    },
  },
};

export default Tabs;
