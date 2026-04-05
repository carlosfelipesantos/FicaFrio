using RefrigeratorRepairSystem.Models;

namespace FicaFrio.Repositories
{
    public interface IClienteRepository
    {
        Task<IEnumerable<Cliente>> GetAllAsync();
        Task<Cliente> GetByIdAsync(int id);
        Task<Cliente> GetClienteWithServicosAsync(int id);
        Task<Cliente> CreateAsync(Cliente cliente);
        Task<Cliente> UpdateAsync(Cliente cliente);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<Cliente>> SearchAsync(string term);
    }
}
