import type { DeepPartial, Theme } from "@chakra-ui/react";

const Menu: DeepPartial<Theme["components"]["Menu"]> = {
  baseStyle: {
    list: {
      _dark: {
        bg: "gray.900",
      },
    },
    item: {
      opacity: ".5",
      _dark: {
        bg: "inherit",
        textDecoration: "none",
        outline: "none",
        boxShadow: "none",
        _hover: {
          opacity: ".9",
        },
        _focus: {
          opacity: ".9",
        },
        _active: {
          opacity: "1",
        },
      },
    },
  },
};

export default Menu;
