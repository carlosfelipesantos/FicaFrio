using Microsoft.EntityFrameworkCore;
using RefrigeratorRepairSystem.Data;

namespace RefrigeratorRepairSystem.Services
{
    public class FinancialService
    {
        private readonly ApplicationDbContext _context;

        public FinancialService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<decimal> GetTotalRevenueAsync(DateTime start, DateTime end)
        {
            return await _context.Services
                .Where(s => s.DataServico >= start &&
                            s.DataServico < end &&
                            s.Status == "Completo")
                .SumAsync(s => s.Valor);
        }

        public async Task<decimal> GetTotalExpensesAsync(DateTime start, DateTime end)
        {
            return await _context.Gastos
                .Where(e => e.DataGasto >= start &&
                            e.DataGasto < end)
                .SumAsync(e => e.Valor);
        }

        public async Task<decimal> GetProfitAsync(DateTime start, DateTime end)
        {
            var revenue = await GetTotalRevenueAsync(start, end);
            var expenses = await GetTotalExpensesAsync(start, end);
            return revenue - expenses;
        }

        public async Task<object> GetDailySummaryAsync(DateTime date)
        {
            var start = date.Date;
            var end = start.AddDays(1);

            return await GetPeriodSummaryAsync(start, end);
        }

        public async Task<object> GetWeeklySummaryAsync()
        {
            var today = DateTime.Now.Date;
            var diff = ((int)today.DayOfWeek + 6) % 7;
            var start = today.AddDays(-diff);
            var end = start.AddDays(7);

            return await GetPeriodSummaryAsync(start, end);
        }

        public async Task<object> GetMonthlySummaryAsync()
        {
            var today = DateTime.Now;
            var start = new DateTime(today.Year, today.Month, 1);
            var end = start.AddMonths(1);

            return await GetPeriodSummaryAsync(start, end);
        }

        public async Task<object> GetYearlySummaryAsync()
        {
            var today = DateTime.Now;
            var start = new DateTime(today.Year, 1, 1);
            var end = start.AddYears(1);

            return await GetPeriodSummaryAsync(start, end);
        }

        private async Task<object> GetPeriodSummaryAsync(DateTime start, DateTime end)
        {
            var services = await _context.Services
                .Where(s => s.DataServico >= start && s.DataServico < end)
                .ToListAsync();

            var revenue = services
                .Where(s => s.Status == "Completo")
                .Sum(s => s.Valor);

            var expenses = await GetTotalExpensesAsync(start, end);

            return new
            {
                startDate = start,
                endDate = end,
                totalServices = services.Count,
                completedServices = services.Count(s => s.Status == "Completo"),
                revenue,
                expenses,
                profit = revenue - expenses
            };
        }
    }
}