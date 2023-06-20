import type { DeepPartial, Theme } from "@chakra-ui/react";

const Input: DeepPartial<Theme["components"]["Input"]> = {
  baseStyle: {
    field: {
      color: "whiteAlpha.600",
    },
  },
};

export default Input;
