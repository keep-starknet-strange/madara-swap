import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/button";
import { Button as ChakraButton } from "@chakra-ui/button";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from "react";

interface ButtonProps extends ChakraButtonProps {
  errorText?: string;
}
const Button = ({ errorText, children, disabled, background, ...props }: ButtonProps) => {
  let isButtonDisabled = disabled;
  let disabledButtonBackground = background;
  if (errorText) {
    isButtonDisabled = true;
    disabledButtonBackground = "error.900";
  }

  return (
    <ChakraButton
      disabled={isButtonDisabled}
      {...props}
      _disabled={{
        // light theme color
        bg: disabledButtonBackground,
        // dark theme color
        _dark: {
          bg: disabledButtonBackground,
        },
        _hover: {
          _dark: {
            bg: disabledButtonBackground,
          },
        },
        cursor: "default",
        opacity: 0.5,
      }}
    >
      {errorText || children}
    </ChakraButton>
  );
};

export default Button;
