import { Box, Flex, Image, useDisclosure } from "@chakra-ui/react";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FC } from "react";
import { FiChevronDown } from "react-icons/fi";

import { useTranslate } from "../../context/TranslateProvider";
import type { TokenState } from "../../context/WalletBaseProvider";

import CoinModal from "./CoinModal";

interface Props {
  value: TokenState | undefined;
  disabled?: boolean;
  onChange: (token: TokenState) => void;
}

const CoinChooser: FC<Props> = ({ value, disabled, onChange }) => {
  const { t } = useTranslate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleChange = (newValue: TokenState) => {
    onChange(newValue);
    onClose();
  };

  return (
    <>
      <Flex
        as={disabled ? "span" : "button"}
        borderRadius={6}
        align="center"
        px={2}
        py={2}
        direction="row"
        _hover={{
          backgroundColor: disabled ? "inherit" : "whiteAlpha.300",
        }}
        onClick={() => {
          if (!disabled) onOpen();
        }}
      >
        {value && (
          <Flex mr={2}>
            <Image
              fallback={<FontAwesomeIcon fontSize="28px" icon={faQuestionCircle} />}
              src={value.logoURI}
              boxSize="28px"
              alt={`${value.name}-logo`}
            />
          </Flex>
        )}
        <Box fontSize={18} mr={1}>
          {value ? value.symbol : t.common.select_a_coin}
        </Box>
        {!disabled && (
          <Flex justify="center" align="center" pt={1}>
            <FiChevronDown size="24px" />
          </Flex>
        )}
      </Flex>
      <CoinModal disableItem={value} onSelected={handleChange} isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default CoinChooser;
