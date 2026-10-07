namespace SecRandom.Control.Api;








public static class ErrorCodes
{
    public const string Unauthorized = "unauthorized";
    public const string Forbidden = "forbidden";
    public const string NotFound = "not_found";
    public const string NotImplemented = "not_implemented";

    
    public const string InvalidRequest = "invalid_request";
    public const string InvalidGroupName = "invalid_group_name";
    public const string ConcurrentModification = "concurrent_modification";

    














    public const string PayloadTooLarge = "payload_too_large";

    
    public const string GroupNotFound = "group_not_found";
    public const string MemberNotFound = "member_not_found";
    public const string NodeNotFound = "node_not_found";
    public const string InsufficientRole = "insufficient_role";
    public const string OwnerMustUseTransfer = "owner_must_use_transfer";
    public const string OwnerCannotBeRemoved = "owner_cannot_be_removed";
    public const string SelfActionNotAllowed = "self_action_not_allowed";

    
    public const string GroupLimitReached = "group_limit_reached";

    
    public const string InviteNotFound = "invite_not_found";
    public const string InviteExpired = "invite_expired";
    public const string InviteUsed = "invite_used";
    public const string InviteRevoked = "invite_revoked";
    public const string InviteNotForCaller = "invite_not_for_caller";

    






    public const string InviteAlreadyMember = "invite_already_member";

    
    public const string TransferNotFound = "transfer_not_found";
    public const string TransferPending = "transfer_pending";
    public const string TransferNotRecipient = "transfer_not_recipient";
    public const string TransferExpired = "transfer_expired";
    public const string TransferResolved = "transfer_resolved";

    

    






    public const string NotRevocable = "not_revocable";

    






    public const string CommandExpired = "command_expired";

    
    public const string AuthNotConfigured = "auth_not_configured";
    public const string NotConfigured = "not_configured";
    public const string TooManyAttempts = "too_many_attempts";
    public const string AlreadyInitialized = "already_initialized";
    public const string ModeNotAvailable = "mode_not_available";
    public const string AdminUsernameInvalid = "admin_username_invalid";
    public const string AdminPasswordTooShort = "admin_password_too_short";
    public const string UnsupportedInLocalMode = "unsupported_in_local_mode";
    public const string ServiceUnavailable = "service_unavailable";

    
    public const string EnrollmentDisabled = "enrollment_disabled";
    public const string EnrollmentCodeInvalid = "enrollment_code_invalid";
    public const string EnrollmentCodeExpired = "enrollment_code_expired";
    public const string EnrollmentCodeUsed = "enrollment_code_used";
    public const string EnrollmentCodeRevoked = "enrollment_code_revoked";
    public const string NodeMismatch = "node_mismatch";
}








public static class ApiResults
{
    public static IResult Error(string code, int statusCode) =>
        Results.Json(new ErrorEnvelope(code), statusCode: statusCode);

    public static IResult Unauthorized(string code = ErrorCodes.Unauthorized) =>
        Error(code, StatusCodes.Status401Unauthorized);

    public static IResult Forbidden(string code = ErrorCodes.Forbidden) =>
        Error(code, StatusCodes.Status403Forbidden);

    






    public static IResult NotFound(string code = ErrorCodes.NotFound) =>
        Error(code, StatusCodes.Status404NotFound);

    public static IResult BadRequest(string code = ErrorCodes.InvalidRequest) =>
        Error(code, StatusCodes.Status400BadRequest);

    public static IResult Conflict(string code) =>
        Error(code, StatusCodes.Status409Conflict);

    
    public static IResult Gone(string code) => Error(code, StatusCodes.Status410Gone);
}

public sealed record ErrorEnvelope(string Code);
