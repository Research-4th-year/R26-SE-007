import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app import app, load_resources

# Ensure models are loaded before tests run
@pytest.fixture(scope="session", autouse=True)
def load_models_for_testing():
    # Call the startup event handler to load the ML/DL models
    # We do this here so it only loads once for the entire test session.
    load_resources()

@pytest.fixture
def client():
    # Provide the TestClient to the tests
    with TestClient(app) as test_client:
        yield test_client
