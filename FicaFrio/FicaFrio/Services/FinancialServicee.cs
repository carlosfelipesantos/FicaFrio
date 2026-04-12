using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RefrigeratorRepairSystem.Data;
using RefrigeratorRepairSystem.Models;

namespace RefrigeratorRepairSystem.Services
{
    public class FinancialService
    {
        private readonly ApplicationDbContext _context;

        public FinancialService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Calcula faturamento total em um período
        public async Task<decimal> GetTotalRevenueAsync(DateTime start, DateTime end)
        {
            return await _context.Services
                .Where(s => s.DataServico.Date >= start.Date &&
                           s.DataServico.Date <= end.Date &&
                           s.Status == "Completo")  
                .SumAsync(s => s.Valor);
        }

        // Calcula gastos totais em um período
        public async Task<decimal> GetTotalExpensesAsync(DateTime start, DateTime end)
        {
            return await _context.Gastos
                .Where(e => e.DataGasto.Date >= start.Date &&
                           e.DataGasto.Date <= end.Date)
                .SumAsync(e => e.Valor);
        }

        // Calcula lucro líquido (faturamento - gastos)
        public async Task<decimal> GetProfitAsync(DateTime start, DateTime end)
        {
            var revenue = await GetTotalRevenueAsync(start, end);
            var expenses = await GetTotalExpensesAsync(start, end);
            return revenue - expenses;
        }

        // Resumo diário
        public async Task<object> GetDailySummaryAsync(DateTime date)
        {
            var start = date.Date;
            var end = start.AddDays(1);

            var services = await _context.Services
                .Where(s => s.DataServico.Date == start)
                .ToListAsync();

            var revenue = services.Where(s => s.Status == "Completo").Sum(s => s.Valor);
            var expenses = await GetTotalExpensesAsync(start, end);

            return new
            {
                Date = start,
                ServicesCount = services.Count,
                CompletedServices = services.Count(s => s.Status == "Completo"),
                Revenue = revenue,
                Expenses = expenses,
                Profit = revenue - expenses
            };
        }

        // Resumo semanal
        public async Task<object> GetWeeklySummaryAsync()
        {
            var today = DateTime.Now;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek + 1);
            var endOfWeek = startOfWeek.AddDays(6);

            return await GetPeriodSummaryAsync(startOfWeek, endOfWeek);
        }

        // Resumo mensal
        public async Task<object> GetMonthlySummaryAsync()
        {
            var today = DateTime.Now;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);
            var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

            return await GetPeriodSummaryAsync(startOfMonth, endOfMonth);
        }

        // Resumo anual
        public async Task<object> GetYearlySummaryAsync()
        {
            var today = DateTime.Now;
            var startOfYear = new DateTime(today.Year, 1, 1);
            var endOfYear = new DateTime(today.Year, 12, 31);

            return await GetPeriodSummaryAsync(startOfYear, endOfYear);
        }

        // Método auxiliar para resumo de período
        private async Task<object> GetPeriodSummaryAsync(DateTime start, DateTime end)
        {
            var revenue = await GetTotalRevenueAsync(start, end);
            var expenses = await GetTotalExpensesAsync(start, end);
            var services = await _context.Services
                .Where(s => s.DataServico.Date >= start.Date && s.DataServico.Date <= end.Date)
                .ToListAsync();

            return new
            {
                StartDate = start,
                EndDate = end,
                TotalServices = services.Count,
                CompletedServices = services.Count(s => s.Status == "Completo"),
                Revenue = revenue,
                Expenses = expenses,
                Profit = revenue - expenses
            };
        }
    }
}