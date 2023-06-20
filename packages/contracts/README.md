# Madara Swap Contracts

Deploy an example Dex on Madara.

## Installation

The project uses poetry. Just use:

```bash
poetry install
```

## Deploy

First copy the [.env.example](./.env.example) into a `.env` file. Default
account addresses for katana, madara and starknet-devnet are set.

Then use the `STARKNET_NETWORK` env variable to target madara, katana or the
devnet. For example:

```bash
STARKNET_NETWORK=madara python ./scripts/compile_madara_swap.py
STARKNET_NETWORK=madara python ./scripts/deploy_madara_swap.py
```
