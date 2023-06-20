import { Flex, HStack, Link } from "@chakra-ui/layout";
import { Box, Img, Text } from "@chakra-ui/react";
import { useEffect } from "react";

import { useBlock, useStarknet } from "../../context";
import { useWhitelist } from "../../context/WhitelistProvider";
import Button from "../form/Button";
import Spinner from "../informational/Spinner";
import { WalletConnect } from "../wallet";
import { useTranslate } from "context/TranslateProvider";

const Whitelist = () => {
  const { t } = useTranslate();
  const { account } = useStarknet();
  const { blockHash } = useBlock();
  const {
    isCheckingWhitelist,
    isLoadingFreeSlots,
    isRegistering,
    getFreeSlots,
    checkWhitelisted,
    freeSlots,
    register,
  } = useWhitelist();

  // called each time block has change
  // To refresh slots count
  useEffect(() => {
    console.log("coucou");
    getFreeSlots();
  }, [blockHash, getFreeSlots]);

  // Called when account change
  useEffect(() => {
    if (account) checkWhitelisted(account);
  }, [account, checkWhitelisted]);

  const registerToWhitelist = () => {
    if (account) {
      register(account);
    }
  };

  const getMainButtonText = () => {
    if (isRegistering || isCheckingWhitelist || isLoadingFreeSlots) {
      return (
        <Flex align="center" justify="center">
          <Spinner />
          <Text ml={2}>{isRegistering ? t.whitelist.registration_inprogress : t.whitelist.loading}</Text>
        </Flex>
      );
    }
    return t.whitelist.register_beta;
  };
  return (
    <Box w="full" display="flex" flexDirection="column" alignItems="center">
      <Img height="78px" src="/logo.svg" alt="logo" />
      <Text mb={12} mt={4} fontWeight="bold" as="h2" fontSize="36px">
        {t.whitelist.title}
      </Text>
      <Text textAlign="center" color="whiteAlpha.600">
        {t.whitelist.introduction}
      </Text>
      <Text
        textAlign="center"
        color="whiteAlpha.600"
        mt={4}
        dangerouslySetInnerHTML={{ __html: t.whitelist.explanation }}
      />
      {!isLoadingFreeSlots && (
        <Text mt={4} as="div" display="inline-block" textAlign="center">
          {freeSlots === 0 ? (
            <>
              <Text as="span" textAlign="center" color="whiteAlpha.600">
                {t.whitelist.unavailable_slot}
              </Text>
              <Text as="span" ml={1} textAlign="center" color="whiteAlpha.600">
                {t.whitelist.dont_worry}
              </Text>
              <HStack w="full" as="div" justify="center" mt={4}>
                <Text color="whiteAlpha.600">{t.whitelist.stay_tuned}</Text>
                <Link
                  color="whiteAlpha.900"
                  href="https://twitter.com/alpharoad_fi"
                  target="_blank"
                  rel="noreferrer"
                  fontWeight="bold"
                >
                  Twitter
                </Link>
                <Text color="whiteAlpha.600">{t.whitelist.stay_tuned_2}</Text>
              </HStack>
            </>
          ) : (
            <>
              <Text as="span" ml={1} textAlign="center" color="whiteAlpha.600">
                {t.whitelist.congrats}
              </Text>
              <Text as="span" ml={1}>
                🥳
              </Text>
              <Text as="span" ml={1} textAlign="center" color="whiteAlpha.600">
                {t.whitelist.access_sentence}
              </Text>
            </>
          )}
        </Text>
      )}
      <HStack my={12} fontSize="2xl">
        <Text>{t.whitelist.available_slots}</Text>
        {isLoadingFreeSlots ? (
          <Box ml={2}>
            <Spinner />
          </Box>
        ) : (
          <Text>{freeSlots}</Text>
        )}
      </HStack>
      <WalletConnect
        customConnectedButton={
          <Button
            disabled={freeSlots === 0 || isLoadingFreeSlots || isRegistering || isCheckingWhitelist}
            onClick={() => registerToWhitelist()}
          >
            {getMainButtonText()}
          </Button>
        }
      />
      <Text mt={4} fontSize="sm" as="span" textAlign="center" color="whiteAlpha.600">
        {t.whitelist.once_registered}
      </Text>
    </Box>
  );
};

export default Whitelist;
