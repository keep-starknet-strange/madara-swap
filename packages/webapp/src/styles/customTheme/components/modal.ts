import type { DeepPartial, Theme } from "@chakra-ui/react";

const Modal: DeepPartial<Theme["components"]["Modal"]> = {
  baseStyle: {
    dialog: {
      _dark: {
        background: "gray.900",
      },
    },
    body: {
      _dark: {
        background: "gray.500",
        borderBottomRadius: "md",
      },
    },
    closeButton: {
      _focus: {
        outline: "none",
        boxShadow: "none",
      },
    },
  },
};

export default Modal;
