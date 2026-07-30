from fastapi import status


class AppException(Exception):
    """
    Base exception for the application.
    """

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "APPLICATION_ERROR"
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

        super().__init__(message)


class PredictionException(AppException):

    def __init__(self, message: str):

        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="PREDICTION_ERROR"
        )


class FeatureGenerationException(AppException):

    def __init__(self, message: str):

        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="FEATURE_GENERATION_ERROR"
        )


class DataException(AppException):

    def __init__(self, message: str):

        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DATA_ERROR"
        )


class ModelException(AppException):

    def __init__(self, message: str):

        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="MODEL_ERROR"
        )