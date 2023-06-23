# Madara swap

A simple **not safe for production** dex meant to test Madara.

## Contracts

TL;DR

```bash
cd packages/contracts
poetry install
cp .env.example .env
STARKNET_NETWORK=madara poetry run python scripts/compile_madara_swap.py
STARKNET_NETWORK=madara poetry run python scripts/deploy_madara_swap.py
STARKNET_NETWORK=madara poetry run python scripts/simple_swap.py
```

See also the [contracts README](./packages/contracts/README.md)

## Front end

🚧 Work in progress
