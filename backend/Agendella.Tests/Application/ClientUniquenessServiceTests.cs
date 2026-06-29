using Agendella.Application.Clients;
using Agendella.Application.Common.Errors;
using Agendella.Application.Tenancy;
using Agendella.Domain.Entities;
using Agendella.Domain.Enums;

namespace Agendella.Tests.Application;

public sealed class ClientUniquenessServiceTests
{
    [Fact]
    public async Task CreateClient_ShouldThrowPhoneDuplicateError_WhenPhoneAlreadyExists()
    {
        var tenantId = Guid.NewGuid();
        var fakeStore = new FakeClientStore(tenantId, "11999999999");
        var fakeTenantContext = new FakeTenantContext(tenantId);
        var service = new ClientManagementService(fakeTenantContext, fakeStore);

        var exception = await Assert.ThrowsAsync<ApplicationRuleException>(() =>
            service.CreateAsync("Outro Cliente", "11999999999", "", "", CancellationToken.None));

        Assert.Equal(ErrorCodes.ClientPhoneDuplicate, exception.Error.Code);
        Assert.Equal(409, exception.Error.StatusCode);
    }

    [Fact]
    public async Task CreateClient_ShouldSucceed_WhenPhoneIsUnique()
    {
        var tenantId = Guid.NewGuid();
        var fakeStore = new FakeClientStore(tenantId, "11888888888");
        var fakeTenantContext = new FakeTenantContext(tenantId);
        var service = new ClientManagementService(fakeTenantContext, fakeStore);

        var client = await service.CreateAsync("Novo Cliente", "11999999999", "", "", CancellationToken.None);

        Assert.NotEqual(Guid.Empty, client.Id);
        Assert.Equal("Novo Cliente", client.Name);
        Assert.Equal("11999999999", client.Phone);
    }

    [Fact]
    public async Task UpdateClient_ShouldThrowPhoneDuplicateError_WhenPhoneAlreadyBelongsToAnotherClient()
    {
        var tenantId = Guid.NewGuid();
        var clientBeingUpdatedId = Guid.NewGuid();
        var otherClientId = Guid.NewGuid();

        // existingPhoneClientId is a DIFFERENT client that already owns "11999999999"
        var fakeStore = new FakeClientStore(tenantId, "11999999999", otherClientId);
        var fakeTenantContext = new FakeTenantContext(tenantId);
        var service = new ClientManagementService(fakeTenantContext, fakeStore);

        var clientToUpdate = new Client
        {
            Id = clientBeingUpdatedId,
            TenantId = tenantId,
            Name = "Cliente Existente",
            Phone = "11777777777",
            Status = RecordStatus.Active
        };
        fakeStore.AddClient(clientToUpdate);

        var exception = await Assert.ThrowsAsync<ApplicationRuleException>(async () =>
            await service.UpdateAsync(clientBeingUpdatedId, "Cliente Existente", "11999999999", "", "", CancellationToken.None));

        Assert.Equal(ErrorCodes.ClientPhoneDuplicate, exception.Error.Code);
    }

    private sealed class FakeTenantContext(Guid? tenantId) : ITenantContext
    {
        public Guid? TenantId { get; } = tenantId;
        public bool HasTenant => TenantId.HasValue;
    }

    private sealed class FakeClientStore(Guid tenantId, string existingPhone, Guid? existingPhoneClientId = null) : IClientStore
    {
        private readonly List<Client> _clients = [];
        private readonly Dictionary<Guid, Client> _byId = [];

        public void AddClient(Client client)
        {
            _clients.Add(client);
            _byId[client.Id] = client;
        }

        public Task<Client?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(_byId.TryGetValue(id, out var c) ? c : null);

        public Task<(IReadOnlyList<Client> Items, string? NextCursor)> ListAsync(int pageSize, string? cursor, CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<Client>, string?)>((_clients, null));

        public Task AddAsync(Client client, CancellationToken cancellationToken = default)
        {
            _clients.Add(client);
            _byId[client.Id] = client;
            return Task.CompletedTask;
        }

        public Task<bool> PhoneExistsAsync(Guid tid, string phone, Guid? excludeClientId, CancellationToken cancellationToken = default)
        {
            if (tid != tenantId || phone != existingPhone)
            {
                return Task.FromResult(false);
            }

            if (excludeClientId.HasValue && existingPhoneClientId.HasValue && excludeClientId.Value == existingPhoneClientId.Value)
            {
                return Task.FromResult(false);
            }

            return Task.FromResult(true);
        }

        public Task<(IReadOnlyList<ClientHistoryEvent> Items, string? NextCursor)> GetHistoryAsync(
            Guid clientId, Guid? requesterProfessionalId, int pageSize, string? cursor, CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<ClientHistoryEvent>, string?)>(([], null));

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
