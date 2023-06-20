import os
from enum import Enum
from pathlib import Path

from dotenv import load_dotenv
from starknet_py.net.full_node_client import FullNodeClient

load_dotenv()

ETH_TOKEN_ADDRESS = 0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7


# TODO: get CHAIN_ID from RPC endpoint when starknet-py doesn't expect an enum
class ChainId(Enum):
    testnet = int.from_bytes(b"SN_GOERLI", "big")
    testnet2 = int.from_bytes(b"SN_GOERLI2", "big")
    katana = int.from_bytes(b"KATANA", "big")


NETWORKS = {
    "sharingan": {
        "name": "sharingan",
        "explorer_url": "",
        "rpc_url": os.getenv("SHARINGAN_RPC_URL"),
        "chain_id": ChainId.testnet,
    },
    "madara": {
        "name": "madara",
        "explorer_url": "",
        "rpc_url": "http://127.0.0.1:9944",
        "chain_id": ChainId.testnet,
    },
    "katana": {
        "name": "katana",
        "explorer_url": "",
        "rpc_url": "http://127.0.0.1:5050",
        "chain_id": ChainId.katana,
    },
    "devnet": {
        "name": "devnet",
        "explorer_url": "",
        "rpc_url": "http://127.0.0.1:5050/rpc",
        "chain_id": ChainId.testnet,
    },
}

NETWORK = NETWORKS[os.getenv("STARKNET_NETWORK", "katana")]
NETWORK["account_address"] = os.environ.get(
    f"{NETWORK['name'].upper()}_ACCOUNT_ADDRESS"
) or os.environ.get("ACCOUNT_ADDRESS")
NETWORK["private_key"] = os.environ.get(
    f"{NETWORK['name'].upper()}_PRIVATE_KEY"
) or os.environ.get("PRIVATE_KEY")


RPC_CLIENT = FullNodeClient(node_url=NETWORK["rpc_url"])


SOURCE_DIR = Path("src")
CONTRACTS = {p.stem: p for p in list(SOURCE_DIR.glob("**/*.cairo"))}
BUILD_DIR = Path("build")
BUILD_DIR.mkdir(exist_ok=True, parents=True)
DEPLOYMENTS_DIR = Path("deployments") / NETWORK["name"]
DEPLOYMENTS_DIR.mkdir(exist_ok=True, parents=True)

COMPILED_CONTRACTS = [
    {"contract_name": "ERC20", "is_account_contract": False},
    {"contract_name": "PoolFactory", "is_account_contract": False},
    {"contract_name": "Pool", "is_account_contract": False},
    {"contract_name": "SwapController", "is_account_contract": False},
    {"contract_name": "OpenzeppelinAccount", "is_account_contract": True},
]
