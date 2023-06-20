import { Link } from "@chakra-ui/layout";
import {
  Box,
  Modal as ChakraModal,
  Flex,
  Image,
  Input,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { useStarknet } from "../../context";
import { useTranslate } from "../../context/TranslateProvider";
import type { TokenState } from "../../context/WalletBaseProvider";
import { useWallet } from "../../context/WalletProvider";

interface ModalProps {
  isOpen: boolean;
  onClose: any;
  disableItem?: TokenState;
  onSelected: (token: TokenState) => void;
}

const CoinModal = ({ isOpen, onClose, disableItem, onSelected }: ModalProps) => {
  const { t } = useTranslate();
  const { account, connected, requestWatchAsset } = useStarknet();
  const { tokens } = useWallet();
  const [filteredTokens, setFilteredTokens] = useState<TokenState[]>([]);
  const [filter, setFilter] = useState<string>();

  const filterTokens = useCallback((tokensToFilter: TokenState[], filterString: string | undefined): TokenState[] => {
    if (!filterString) return tokensToFilter;
    const filterStringLowerCase: string = filterString.toLowerCase();
    return tokensToFilter.filter((token: TokenState) => {
      return (
        token.address.toLowerCase().indexOf(filterStringLowerCase) > -1 ||
        token.symbol.toLowerCase().indexOf(filterStringLowerCase) > -1 ||
        token.name.toLowerCase().indexOf(filterStringLowerCase) > -1
      );
    });
  }, []);

  const addTokenToWallet = (e: any, tokenToWatch: TokenState) => {
    e.stopPropagation();
    requestWatchAsset(tokenToWatch);
  };

  useEffect(() => {
    setFilteredTokens(filterTokens(tokens, filter));
  }, [tokens, filterTokens, filter]);

  const handleInputChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const newFilter = evt.target.value;
    // Will trigger effect above
    setFilter(newFilter);
  };

  const renderCoinItem = (token: TokenState, isDisabled: boolean) => {
    return (
      <Flex
        key={`token-item${token.address}`}
        w="full"
        direction="row"
        justify="space-between"
        fontSize="sm"
        px={6}
        py={2}
        cursor={isDisabled ? "normal" : "pointer"}
        opacity={isDisabled ? 0.4 : "inherit"}
        _hover={{
          backgroundColor: isDisabled ? "inherit" : "whiteAlpha.100",
        }}
        onClick={() => !isDisabled && onSelected(token)}
      >
        <Flex direction="row" justify="flex-start" align="center">
          <Box w="8" mr={4}>
            <Image
              boxSize="28px"
              fallback={<FontAwesomeIcon size="2x" icon={faQuestionCircle} />}
              src={token.logoURI}
              alt={`${token.name}-logo`}
            />
          </Box>
          <Flex direction="column">
            <Text mb={1}>{token.symbol}</Text>
            <Text opacity={0.4} fontSize="xs">
              {token.name}
            </Text>
          </Flex>
        </Flex>
        <Flex direction="column" justify="space-between" align="flex-end">
          <Box mb={1}>
            {account && token.balance && parseFloat(token.balance).toFixed(4)}
            {account && !token.balance && <FontAwesomeIcon icon={faCircleNotch} spin />}
            {!account && "-"}
          </Box>
          {connected && (
            <Link opacity={0.4} fontSize="xs">
              <Text onClick={(e) => addTokenToWallet(e, token)}>{t.common.add_to_watchlist}</Text>
            </Link>
          )}
        </Flex>
      </Flex>
    );
  };

  return (
    <ChakraModal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t.common.choose_coin}</ModalHeader>
        <ModalCloseButton />
        <Box w="full" mb={6} px={6}>
          <Input
            focusBorderColor="inherit"
            placeholder={t.common.token_name_or_address_placeholder}
            onChange={handleInputChange}
          />
        </Box>
        <ModalBody backgroundColor="red" px={0}>
          <Flex w="full" align="flex-start" direction="column">
            {filteredTokens.length > 0 ? (
              <VStack w="full" spacing={2}>
                {disableItem && renderCoinItem(disableItem, true)}
                {filteredTokens
                  .filter((token: TokenState) => !disableItem || disableItem.address !== token.address)
                  .map((token: TokenState) => {
                    return renderCoinItem(token, false);
                  })}
              </VStack>
            ) : (
              <Text px={6} py={2} opacity={0.6}>
                {t.common.no_result}
              </Text>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </ChakraModal>
  );
};

export default CoinModal;
