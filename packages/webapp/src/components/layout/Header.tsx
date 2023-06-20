import { Link } from "@chakra-ui/layout";
import { Flex, HStack, Heading, Text, Tooltip } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import type { FC } from "react";

import { useTranslate } from "context/TranslateProvider";

import type { MenuItf } from "./MenuButton";

interface MenuProps {
  menus: MenuItf[];
}
const Menu = ({ menus }: MenuProps) => {
  const router = useRouter();
  return (
    <HStack ml={8} spacing={4} fontSize="15px">
      {menus.map(({ children, href, disabled, disabledTooltip }: MenuItf) => {
        let color;
        if (disabled) {
          color = "whiteAlpha.300";
        } else if (router.pathname === href) {
          color = "whiteAlpha.900";
        } else {
          color = "whiteAlpha.600";
        }
        return disabled ? (
          <Tooltip key={`menu-tooltip-${href}`} label={disabledTooltip} closeOnClick={false}>
            <Text cursor="pointer" color={color}>
              {children}
            </Text>
          </Tooltip>
        ) : (
          <NextLink key={`menu-item-${href}`} href={href} passHref>
            <Text
              as="button"
              transition="color .1s ease-in"
              color={color} // Only if current menu
              _hover={{ color: "whiteAlpha.900" }}
            >
              {children}
            </Text>
          </NextLink>
        );
      })}
    </HStack>
  );
};

const Header: FC = () => {
  const { t } = useTranslate();

  return (
    <Flex
      as="header"
      bg="black"
      width="full"
      align="center"
      justify="center"
      position="fixed"
      zIndex={100}
      borderBottom="1px solid"
      borderColor="whiteAlpha.300"
      py={2}
    >
      <Flex align="center" w={{ md: "100%", lg: "70%" }} maxWidth="1120px" px={{ md: 4, lg: 0 }} minWidth="800px">
        <Heading as="h1" size="md" ml={4} pr={4} borderRight="1px solid" borderColor="whiteAlpha.300">
          <NextLink href="/">
            <Link _hover={{ textDecoration: "none" }} fontSize="16px">
              {t.menu.title}
            </Link>
          </NextLink>
        </Heading>

        <Menu
          menus={[
            { children: t.menu.swap, href: "/" },
            { children: t.menu.pool, href: "/pool" },
          ]}
        />
      </Flex>
    </Flex>
  );
};

export default Header;
