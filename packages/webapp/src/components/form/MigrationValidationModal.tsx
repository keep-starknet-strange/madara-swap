import { Flex, HStack } from "@chakra-ui/layout";
import {
  Box,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { faCircleNotch } from "@fortawesome/free-regular-svg-icons";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect, useState } from "react";
import { validateAndParseAddress } from "starknet";

import { useTranslate } from "../../context/TranslateProvider";
import type { PoolState, TokenState } from "../../context/WalletBaseProvider";
import DoubleTokenImage from "../informational/DoubleTokenImage";
import TruncatedAmount from "../informational/TruncatedAmount";

import Button from "./Button";
import Input from "./Input";

interface TransactionValidationProps {
  isOpen: boolean;
  onClose: (validate: boolean, recipient: string) => void;
  tokens: TokenState[];
  pools: PoolState[];
}

const MigrationValidationModal = ({ isOpen, onClose, tokens, pools }: TransactionValidationProps) => {
  const { t } = useTranslate();
  const [userAssetsLoading, setUserAssetsLoading] = useState<boolean>(true);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [addressError, setAddressError] = useState<boolean>(false);

  useEffect(() => {
    const isLoading: boolean =
      (pools.length > 0 &&
        pools.findIndex((pool) => {
          return !pool.balance; // No defined balance seems not loaded yet
        }) !== -1) ||
      (tokens.length > 0 &&
        tokens.findIndex((token) => {
          return !token.balance; // No defined balance seems not loaded yet
        }) !== -1);
    setUserAssetsLoading(isLoading);
  }, [pools, tokens]);

  const onValidateClick = () => {
    try {
      if (!recipientAddress) throw Error();
      // Will throw error if not a valid address
      validateAndParseAddress(recipientAddress);
      onClose(true, recipientAddress);
    } catch (e) {
      setAddressError(true);
    }
  };
  const renderFooter = (validationText: string) => {
    return (
      <Button
        w="full"
        _hover={{ border: "1px solid", borderColor: "whiteAlpha.900" }}
        mt={8}
        onClick={() => onValidateClick()}
        disabled={userAssetsLoading}
      >
        {validationText}
      </Button>
    );
  };

  const renderAssetInfo = (name: string, symbol: string, balance: string, logo: any) => {
    return (
      <Flex key={`migrate-asset-${name}`} direction="row" justify="space-between" align="flex-start" marginY={2}>
        <HStack>
          <Box minW="50px">{logo}</Box>
          <Flex direction="column">
            <Text mb={1}>{symbol}</Text>
            <Text opacity={0.4} fontSize="xs">
              {name}
            </Text>
          </Flex>
        </HStack>
        {balance ? <TruncatedAmount amount={balance} symbol="" /> : <FontAwesomeIcon icon={faCircleNotch} spin />}
      </Flex>
    );
  };

  const renderTokenInfo = (token: TokenState) => {
    return renderAssetInfo(
      token.name,
      token.symbol,
      token.balance,
      <Image
        fallback={<FontAwesomeIcon fontSize="28px" icon={faQuestionCircle} />}
        src={token.logoURI}
        boxSize="28px"
        alt={`${token.name}-logo`}
      />
    );
  };

  const renderPoolInfo = (pool: PoolState) => {
    return renderAssetInfo(
      pool.name,
      pool.symbol,
      pool.balance,
      <DoubleTokenImage token0={pool.token0} token1={pool.token1} />
    );
  };

  const renderTooltipContent = () => {
    return (
      <VStack>
        <Text fontSize="sm" my={4}>
          {t.common.migrate_text}
        </Text>
        <Text fontSize="sm" my={4}>
          {t.common.sync_addr_text}
        </Text>
      </VStack>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false, "")}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t.common.migrate_assets}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column" justify="space-between" align="flex-start">
            <Box my={4} fontSize="md">
              <Text as="span" mr={2}>
                {t.common.migrate_assets_infos}
              </Text>
              <Tooltip key="migration-infos-tooltip" label={renderTooltipContent()} closeOnClick={false}>
                <Text as="span" cursor="pointer" color="whiteAlpha.600">
                  {t.common.more}
                </Text>
              </Tooltip>
            </Box>
            <Box w="full" mb={4}>
              <Text mb={2} fontSize="sm">
                {t.common.recipient}
              </Text>
              <Input
                fontSize="md"
                placeholder={t.common.recipient_address}
                value={recipientAddress}
                onInputChanged={(e) => {
                  setAddressError(false);
                  setRecipientAddress(e.target.value);
                }}
              />
              {addressError && (
                <Text mt={2} fontSize="sm" color="error.900">
                  {t.common.error_address}
                </Text>
              )}
            </Box>
            <Box w="full" mb={4}>
              <Text mb={2} fontSize="sm">
                Assets
              </Text>
              <Flex direction="column" justify="flex-start" w="full">
                {tokens.map((asset: TokenState) => {
                  return renderTokenInfo(asset);
                })}
                {pools.map((pool: PoolState) => {
                  return renderPoolInfo(pool);
                })}
              </Flex>
            </Box>
            {renderFooter(t.common.confirm)}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default MigrationValidationModal;
