using Microsoft.EntityFrameworkCore;
using RefrigeratorRepairSystem.Data;
using RefrigeratorRepairSystem.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RefrigeratorRepairSystem.Repositories
{
    public class ServiceRepository : IServiceRepository
    {
        private readonly ApplicationDbContext _context;

        public ServiceRepository(ApplicationDbContext context)
        {
            _context = context;
        }


        public async Task<IEnumerable<Service>> GetAllAsync()
        {
            return await _context.Services
                .Include(s => s.Gastos)  // 🔥 Adicione esta linha
                .OrderByDescending(s => s.DataServico)
                .ToListAsync();
        }

        public async Task<Service> GetByIdAsync(int id)
        {
            return await _context.Services
                .Include(s => s.Gastos)  // 🔥 Já deve ter esta linha
                .FirstOrDefaultAsync(s => s.Id == id);
        }


        public async Task<Service> CreateAsync(Service service)
        {
            service.CriadoEm = DateTime.Now;
            _context.Services.Add(service);
            await _context.SaveChangesAsync();
            return service;
        }


        public async Task<Service> UpdateAsync(Service service)
        {
            _context.Entry(service).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return service;
        }


        public async Task<bool> DeleteAsync(int id)
        {
            var service = await _context.Services.FindAsync(id);
            if (service == null) return false;

            _context.Services.Remove(service);
            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<IEnumerable<Service>> GetByStatusAsync(string status)
        {
            return await _context.Services
                .Where(s => s.Status == status)
                .OrderByDescending(s => s.DataServico)
                .ToListAsync();
        }


        public async Task<IEnumerable<Service>> GetByDateRangeAsync(DateTime start, DateTime end)
        {
            return await _context.Services
                .Where(s => s.DataServico.Date >= start.Date && s.DataServico.Date <= end.Date)
                .OrderByDescending(s => s.DataServico)
                .ToListAsync();
        }
    }
}