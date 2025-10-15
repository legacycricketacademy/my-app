SHELL := /bin/bash
PY := $(shell command -v python || command -v python3)
ENV := .env

bootstrap:
	@echo "[Agent] Bootstrapping..."
	@$(PY) -m pip -q install -r requirements.txt
	@git --version && node -v && npm -v
	@echo "✔ Tooling OK"

run:
	@if [ -n "$$PLAN" ]; then \
	  $(PY) main.py --plan $$PLAN; \
	else \
	  $(PY) main.py --goal "$$GOAL"; \
	fi
