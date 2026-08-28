import {
  MarketplaceApiError,
} from "@/services/c03-marketplace/api-client";

export function getApiErrorMessage(
  error: unknown
): string {
  if (error instanceof MarketplaceApiError) {
    if (error.statusCode === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (error.statusCode === 403) {
      return (
        "You do not have permission to perform " +
        "this action."
      );
    }

    if (error.statusCode === 404) {
      return error.message || "The requested data was not found.";
    }

    return (
      error.message ||
      "Something went wrong. Please try again."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}