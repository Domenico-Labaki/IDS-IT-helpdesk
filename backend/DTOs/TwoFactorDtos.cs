namespace HelpdeskApi.DTOs;

public class TwoFactorSetupResponse
{
    public string SharedKey { get; set; } = string.Empty;
    public string ProvisioningUri { get; set; } = string.Empty;
}

public class TwoFactorVerifyRequest
{
    public string Code { get; set; } = string.Empty;
}

public class TwoFactorSetupRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string? CurrentCode { get; set; }
}

public class TwoFactorDisableRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class TwoFactorLoginRequest
{
    public string TwoFactorToken { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}
