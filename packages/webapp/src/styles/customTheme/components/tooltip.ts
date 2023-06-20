import type { DeepPartial, Theme } from "@chakra-ui/react";

const Tooltip: DeepPartial<Theme["components"]["Tooltip"]> = {
  baseStyle: {
    background: "gray.900",
    color: "whiteAlpha.800",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "12px",
  },
};

export default Tooltip;
