import type { DeepPartial, Theme } from "@chakra-ui/react";

const Slider: DeepPartial<Theme["components"]["Slider"]> = {
  baseStyle: {
    thumb: {
      _dark: {
        bg: "white",
        outline: "none",
        boxShadow: "none",
      },
    },
    track: {
      _dark: {
        bg: "whiteAlpha.300",
      },
    },
    filledTrack: {
      _dark: {
        bg: "transparent",
      },
    },
  },
};

export default Slider;
