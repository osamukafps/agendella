using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;

namespace Agendella.Infrastructure.Auth;

public sealed class JwtSigningKeyProvider
{
    private JwtSigningKeyProvider(RSA rsa)
    {
        Rsa = rsa;
        SigningKey = new RsaSecurityKey(rsa);
        SigningCredentials = new SigningCredentials(SigningKey, SecurityAlgorithms.RsaSha256);
    }

    public RSA Rsa { get; }

    public RsaSecurityKey SigningKey { get; }

    public SigningCredentials SigningCredentials { get; }

    public static JwtSigningKeyProvider Create(JwtOptions options)
    {
        var rsa = RSA.Create();

        if (!string.IsNullOrWhiteSpace(options.PrivateKeyPath) && File.Exists(options.PrivateKeyPath))
        {
            rsa.ImportFromPem(File.ReadAllText(options.PrivateKeyPath));
            return new JwtSigningKeyProvider(rsa);
        }

        if (!string.IsNullOrWhiteSpace(options.PublicKeyPath) && File.Exists(options.PublicKeyPath))
        {
            rsa.ImportFromPem(File.ReadAllText(options.PublicKeyPath));
            return new JwtSigningKeyProvider(rsa);
        }

        return new JwtSigningKeyProvider(rsa);
    }
}
