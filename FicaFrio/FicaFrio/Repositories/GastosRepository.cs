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

        public async Task<Gasto> GetByIdAsync(int id)
        {
            return await _context.Gastos.FindAsync(id);
        }

        // Adiciona um novo gasto
        public async Task<Gasto> CreateAsync(Gasto gastos)
            {
                _context.Gastos.Add(gastos);
                await _context.SaveChangesAsync();
                return gastos;
            }

            // Busca todos os gastos de um serviço específico
            public async Task<IEnumerable<Gasto>> GetByServiceIdAsync(int serviceId)
            {
                return await _context.Gastos
                    .Where(e => e.ServiceId == serviceId)
                    .OrderByDescending(e => e.DataGasto)
                    .ToListAsync();
            }

            // Remove um gasto
            public async Task<bool> DeleteAsync(int id)
            {
                var gastos = await _context.Gastos.FindAsync(id);
                if (gastos == null) return false;

                _context.Gastos.Remove(gastos);
                await _context.SaveChangesAsync();
                return true;
            }

            // Calcula total de gastos em um período
            public async Task<decimal> GetTotalExpensesByDateRangeAsync(DateTime start, DateTime end)
            {
                return await _context.Gastos
                    .Where(e => e.DataGasto.Date >= start.Date && e.DataGasto.Date <= end.Date)
                    .SumAsync(e => e.Valor);
            }
        }
    }


