import { Flex, Link, Text } from "@chakra-ui/react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import NextLink from "next/link";
import { useEffect, useState } from "react";

import { useBlock } from "../../context/BlockProvider";
import { useTranslate } from "../../context/TranslateProvider";
import Spinner from "../informational/Spinner";

import MenuButton from "./MenuButton";

const Footer = () => {
  const { locale, t } = useTranslate();
  const { blockNumber } = useBlock();
  const [animate, setAnimate] = useState<boolean>(false);

  // called each time block has number change
  useEffect(() => {
    setAnimate(true);
    setTimeout(() => {
      setAnimate(false);
    }, 1000);
  }, [blockNumber]);

  return (
    <Flex
      position="relative"
      as="footer"
      width="full"
      justify="center"
      borderTop="1px solid"
      borderColor="whiteAlpha.300"
      pt={2}
      pb={4}
    >
      <Flex
        w={{ md: "100%", lg: "70%" }}
        maxWidth="1120px"
        px={{ md: 4, lg: 0 }}
        minWidth="800px"
        direction="row"
        align="center"
        justify="space-between"
      >
        <Flex direction="row" fontSize="14px" color="whiteAlpha.600">
          <Text>Copyright ©</Text>
          <Text ml={1}>{new Date().getFullYear()} - </Text>
          <Text ml={1}>Madara Swap. {t.common.all_rights}</Text>
        </Flex>
        <Flex direction="row" ml={8} fontSize="sm" align="center">
          <Text mr={4}>v1.0.0 beta</Text>
          <MenuButton
            menus={[
              {
                href: "",
                children: (
                  <NextLink href="/" passHref locale="fr">
                    <Link _hover={{ textDecoration: "none" }} href="/" w="full">
                      Français
                    </Link>
                  </NextLink>
                ),
              },
              {
                href: "",
                children: (
                  <NextLink href="/" passHref locale="en">
                    <Link _hover={{ textDecoration: "none" }} href="/" w="full">
                      English
                    </Link>
                  </NextLink>
                ),
              },
            ]}
            icon={faChevronDown}
            text={locale === "en" ? "English" : "Français"}
            mainGroupTitle="Language"
          />
        </Flex>
      </Flex>
      <Flex position="fixed" direction="row" align="center" justify="flex-end" right={2} bottom={{ sm: 20, lg: 6 }}>
        <Text mr={2} fontSize={12}>
          {blockNumber}
        </Text>
        <Spinner animate={animate} color="#2ecc71" />
      </Flex>
    </Flex>
  );
};

export default Footer;
