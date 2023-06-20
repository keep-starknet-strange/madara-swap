import {
    Box,
    Modal as ChakraModal,
    Flex,
    Link,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Text,
    VStack,
} from "@chakra-ui/react";
import {
    faArrowUpRightFromSquare,
    faCheckCircle,
    faCheckDouble,
    faCircleNotch,
    faCopy,
    faQuestionCircle,
    faTimesCircle,
} from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

import { useTranslate } from "context/TranslateProvider";
import { useStarknet } from "../../context/StarknetProvider";
import type { StoredTransaction } from "../../context/TransactionsProvider";
import { useTransactions } from "../../context/TransactionsProvider";
import environment from "../../environment";
import { cropAddress } from "../../helpers/address";
import IconLink from "../form/IconLink";

interface ModalProps {
  isOpen: boolean;
  onClose: any;
}
const WalletModal = ({ isOpen, onClose }: ModalProps) => {
  const { account, disconnectBrowserWallet } = useStarknet();
  const { t } = useTranslate();
  const { transactions } = useTransactions();
  const [copyAnimated, setCopyAnimate] = useState<boolean>(false);

  const getTxStatusIcon = (tx: StoredTransaction) => {
    let color = "inherit";
    let icon;
    let spin = false;
    switch (tx.code) {
      case "PENDING":
      case "NOT_RECEIVED":
      case "RECEIVED":
        spin = true;
        icon = faCircleNotch;
        break;
      case "ACCEPTED_ON_L2":
      case "ACCEPTED_ON_L1":
        icon = faCheckCircle;
        color = "green.500";
        break;
      case "REJECTED":
        icon = faTimesCircle;
        color = "red.500";
        break;
      default:
        icon = faQuestionCircle;
    }
    return (
      <Box color={color}>
        <FontAwesomeIcon icon={icon} spin={spin} />
      </Box>
    );
  };

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    setCopyAnimate(true);
    setTimeout(() => {
      setCopyAnimate(false);
    }, 500);
    navigator.clipboard.writeText(text);
  };

  const disconnect = () => {
    disconnectBrowserWallet();
    onClose();
  };

  return (
    <ChakraModal scrollBehavior="inside" isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t.common.wallet}</ModalHeader>
        <ModalCloseButton />
        <Box px={6} pb={4}>
          <Flex p={4} mb={6} border="1px solid" borderColor="gray.300" borderRadius="md" direction="column">
            <Flex w="full" direction="row" justify="space-between" opacity={0.6} fontSize="xs" pb={2}>
              <Text>{t.common.connected_with_argent_x}</Text>
              <Link>
                <Text onClick={disconnect}>{t.common.disconnect_wallet}</Text>
              </Link>
            </Flex>
            <Text fontSize="xl">{cropAddress(account?.address)}</Text>
            <Flex w="full" direction="row" justify="flex-start" fontSize="sm" pt={2}>
              {copyAnimated ? (
                <IconLink icon={faCheckDouble}>{t.common.copied}</IconLink>
              ) : (
                <IconLink icon={faCopy} onClick={() => copyToClipboard(account?.address)}>
                  {t.common.copy_address}
                </IconLink>
              )}
              <IconLink
                href={`${environment.explorerUrl}/contract/${account?.address}`}
                ml={4}
                icon={faArrowUpRightFromSquare}
              >
                {t.common.view_on_explorer}
              </IconLink>
            </Flex>
          </Flex>
          <Text fontSize="md">{t.common.your_transactions}</Text>
        </Box>
        <ModalBody px={6} py={4}>
          <Flex w="full" align="flex-start" direction="column">
            {transactions.length > 0 ? (
              <VStack w="full" spacing={2}>
                {transactions.map((tx: StoredTransaction) => {
                  return (
                    <Flex key={`tx-${tx.hash}`} w="full" direction="row" justify="space-between" fontSize="sm">
                      <Flex direction="column">
                        <Text>{tx.description}</Text>
                        <Text opacity={0.4} fontSize="xs">
                          <Link target="_blank" href={`${environment.explorerUrl}/tx/${tx.hash}`}>
                            {cropAddress(tx.hash)}
                          </Link>
                        </Text>
                      </Flex>
                      <Flex justify="flex-end" align="flex-start">
                        {getTxStatusIcon(tx)}
                      </Flex>
                    </Flex>
                  );
                })}
              </VStack>
            ) : (
              <Text opacity={0.6}>{t.common.your_transactions_will_appear_here}</Text>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </ChakraModal>
  );
};

export default WalletModal;
