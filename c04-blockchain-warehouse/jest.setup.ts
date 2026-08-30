// Guarantees required env vars exist so tests never depend on a local .env file.
process.env.JWT_SECRET         ||= 'test_jwt_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET ||= 'test_refresh_secret_at_least_32_chars_long';
process.env.JWT_EXPIRES_IN     ||= '15m';
