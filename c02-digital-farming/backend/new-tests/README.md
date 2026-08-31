# Comprehensive Testing Suite

This directory contains the unit, integration, and system tests for the `c02-digital-farming` backend.

## Directory Structure
- `test/unit/`: Tests individual functions, schemas, and core logic in isolation.
- `test/integration/`: Tests API endpoints and their interaction with mocked services/models.
- `test/system/`: Tests full end-to-end user workflows (e.g., Variety -> Yield -> History).

## Prerequisites
Make sure you have installed the test dependencies in your virtual environment:
```bash
pip install pytest pytest-asyncio httpx
```

## Running the Tests

To run the tests, execute these commands from the `backend/` directory:

### Run All Tests
```bash
python -m pytest new-tests/ -v
```

### Run Unit Tests Only
```bash
python -m pytest new-tests/ -m unit -v
```

### Run Integration Tests Only
```bash
python -m pytest new-tests/ -m integration -v
```

### Run System Tests Only
```bash
python -m pytest new-tests/ -m system -v
```
