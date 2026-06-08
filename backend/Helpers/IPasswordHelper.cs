namespace HelpdeskApi.Helpers
{
    public interface IPasswordHelper
    {
        string Hash(string plain);
        bool Verify(string plain, string hash);
        bool IsPasswordValid(string password);
    }
}
