import type { DeepPartial, Theme } from "@chakra-ui/react";

const Popover: DeepPartial<Theme["components"]["Popover"]> = {
  baseStyle: {
    content: {
      _focus: {
        boxShadow: "none",
      },
      _dark: {
        bg: "gray.900",
      },
    },
    header: {
      border: "none",
    },
    footer: {
      border: "none",
    },
    body: {
      opacity: ".5",
    },
  },
};

export default Popover;
