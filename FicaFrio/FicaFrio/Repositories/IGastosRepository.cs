using RefrigeratorRepairSystem.Models;

namespace FicaFrio.Repositories
{
    public interface IGastosRepository
    {
        Task<Gasto> GetByIdAsync(int id);
        Task<Gasto> CreateAsync(Gasto expense);
        Task<IEnumerable<Gasto>> GetByServiceIdAsync(int serviceId);
        Task<bool> DeleteAsync(int id);
        Task<decimal> GetTotalExpensesByDateRangeAsync(DateTime start, DateTime end);
    }
}
