using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RefrigeratorRepairSystem.Models;

namespace RefrigeratorRepairSystem.Repositories
{
    public interface IServiceRepository
    {
        Task<IEnumerable<Service>> GetAllAsync();
        Task<Service> GetByIdAsync(int id);
        Task<Service> CreateAsync(Service service);
        Task<Service> UpdateAsync(Service service);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<Service>> GetByStatusAsync(string status);
        Task<IEnumerable<Service>> GetByDateRangeAsync(DateTime start, DateTime end);
    }
}