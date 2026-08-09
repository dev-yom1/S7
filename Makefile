.PHONY: install dev test lint check

install:
	python -m pip install .

dev:
	python -m pip install -e ".[dev]"

test:
	pytest

lint:
	ruff check .

check: test lint
	python -m compileall -q src
