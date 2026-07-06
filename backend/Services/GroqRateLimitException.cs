namespace HelpdeskApi.Services;

public class GroqRateLimitException : InvalidOperationException
{
    public int RetryAfterSeconds { get; }

    public GroqRateLimitException(string message, int retryAfterSeconds)
        : base(message)
    {
        RetryAfterSeconds = retryAfterSeconds;
    }
}
