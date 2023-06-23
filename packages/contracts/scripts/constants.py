import json
import os
from enum import Enum
from pathlib import Path

import requests
from dotenv import load_dotenv
from starknet_py.net.full_node_client import FullNodeClient

load_dotenv()

ETH_TOKEN_ADDRESS = 0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7


NETWORKS = {
    "sharingan": {
        "name": "sharingan",
        "explorer_url": "",
        "rpc_url": os.getenv("SHARINGAN_RPC_URL"),
    },
    "madara": {
        "name": "madara",
        "explorer_url": "",
        "rpc_url": "http://127.0.0.1:9944",
    },
    "katana": {
        "name": "katana",
        "explorer_url": "",
        "rpc_url": "http://127.0.0.1:5050",
    },
    "devnet": {
        "name": "devnet",
        "explorer_url": "",
        "rpc_url": "http://127.0.0.1:5050/rpc",
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
try:
    response = requests.post(
        RPC_CLIENT.url,
        json={
            "jsonrpc": "2.0",
            "method": f"starknet_chainId",
            "params": [],
            "id": 0,
        },
    )
    payload = json.loads(response.text)

    class ChainId(Enum):
        chain_id = int(payload["result"], 16)

    NETWORK["chain_id"] = ChainId.chain_id
except:
    pass

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
