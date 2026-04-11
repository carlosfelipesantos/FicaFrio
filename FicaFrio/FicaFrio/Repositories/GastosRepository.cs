using Microsoft.EntityFrameworkCore;
using RefrigeratorRepairSystem.Data;
using RefrigeratorRepairSystem.Models;

namespace FicaFrio.Repositories
{
    public class GastosRepository : IGastosRepository
    {
        private readonly ApplicationDbContext _context;

        public GastosRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Gasto?> GetByIdAsync(int id)
        {
            return await _context.Gastos.FindAsync(id);
        }

        // 🔥 Corrigido: parâmetro renomeado para 'gasto'
        public async Task<Gasto> CreateAsync(Gasto gasto)
        {
            _context.Gastos.Add(gasto);
            await _context.SaveChangesAsync();
            return gasto;
        }

        public async Task<IEnumerable<Gasto>> GetByServiceIdAsync(int serviceId)
        {
            return await _context.Gastos
                .Where(e => e.ServiceId == serviceId)
                .OrderByDescending(e => e.DataGasto)
                .ToListAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var gasto = await _context.Gastos.FindAsync(id);
            if (gasto == null) return false;

            _context.Gastos.Remove(gasto);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<decimal> GetTotalExpensesByDateRangeAsync(DateTime start, DateTime end)
        {
            return await _context.Gastos
                .Where(e => e.DataGasto.Date >= start.Date && e.DataGasto.Date <= end.Date)
                .SumAsync(e => e.Valor);
        }
    }
}