FROM python:3.9.13

# install poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="$PATH:/root/.local/bin"
RUN poetry config virtualenvs.create false

# install madara swap
WORKDIR /app
COPY poetry.lock .
COPY pyproject.toml .
COPY scripts ./scripts
COPY README.md .
RUN poetry install
# split install in two steps to leverage docker cache
COPY . .
RUN poetry install

# Build contracts
RUN python scripts/compile_madara_swap.py

# Deploy madara swap
ENV STARKNET_NETWORK=sharingan
ENV SHARINGAN_RPC_URL=https://sharingan.madara.zone

CMD ["python", "scripts/deploy_madara_swap.py"]