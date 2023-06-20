import type { ButtonProps } from "@chakra-ui/react";
import { Button, Flex, Text, useDisclosure } from "@chakra-ui/react";
import { faCirclePlay } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

import type { StoredTransaction } from "context";
import { useStarknet, useTransactions } from "context";
import { useTranslate } from "context/TranslateProvider";
import deployments from "../../../../contracts/deployments/katana/deployments.json";
import type { TokenState } from "../../context/WalletBaseProvider";
import { useWallet } from "../../context/WalletProvider";
import { cropAddress } from "../../helpers/address";

import WalletModal from "./WalletModal";

const BTC_ERC20_ADDRESS = deployments.bitcoin.address;
interface WalletConnectProps extends ButtonProps {
  full?: boolean;
  displayBrandBorder?: boolean;
  customConnectedButton?: any;
}
const WalletConnect = ({ full, customConnectedButton, displayBrandBorder }: WalletConnectProps) => {
  const { t } = useTranslate();
  const { account, connected, connectBrowserWallet } = useStarknet();
  const { tokens } = useWallet();
  const { transactions } = useTransactions();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [protocolToken, setProtocolToken] = useState<TokenState>();

  const pendingTxs = transactions.filter((tx: StoredTransaction) => {
    return tx.code === "PENDING" || tx.code === "RECEIVED" || tx.code === "NOT_RECEIVED";
  });
  const pendingTxsLength = pendingTxs.length;

  useEffect(() => {
    const newProtocolToken = tokens.find((token: TokenState) => token.address === BTC_ERC20_ADDRESS);
    if (newProtocolToken) setProtocolToken(newProtocolToken);
  }, [tokens]);

  const renderPendingTxCount = () => {
    return (
      <Flex direction="row" justify="space-between" align="center">
        <FontAwesomeIcon size="xs" icon={faCirclePlay} spin />
        <Text ml={2}>
          {pendingTxsLength} {t.common.pending}
        </Text>
      </Flex>
    );
  };
  return (
    <Flex
      p={displayBrandBorder ? 0.5 : 0}
      align="center"
      border={displayBrandBorder ? "1px solid" : "0px solid"}
      borderColor="whiteAlpha.300"
      borderRadius="10px"
      opacity={0.9}
    >
      {!connected ? (
        <Button
          w={full ? "full" : "inherit"}
          onClick={() => {
            connectBrowserWallet();
          }}
        >
          {t.common.connect_wallet}
        </Button>
      ) : (
        customConnectedButton || (
          <>
            <Text mx={4} fontSize="md">
              {protocolToken ? `${parseInt(protocolToken.balance || "0", 10)} ${protocolToken.symbol}` : 0}
            </Text>
            <Button onClick={onOpen}>
              {account && pendingTxsLength > 0 && renderPendingTxCount()}
              {account && pendingTxsLength === 0 && cropAddress(account.address)}
              {!account && t.common.no_account}
            </Button>
          </>
        )
      )}
      <WalletModal isOpen={isOpen} onClose={onClose} />
    </Flex>
  );
};

export default WalletConnect;
