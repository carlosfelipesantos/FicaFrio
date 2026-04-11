using FicaFrio.Repositories;
using Microsoft.AspNetCore.Mvc;
using RefrigeratorRepairSystem.Models;
using RefrigeratorRepairSystem.Repositories;
using RefrigeratorRepairSystem.Services;
using System;
using System.Threading.Tasks;

namespace RefrigeratorRepairSystem.Controllers  // 🔥 Namespace único e correto
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServicesController : ControllerBase
    {
        private readonly IServiceRepository _serviceRepository;
        private readonly FinancialService _financialService;

        public ServicesController(IServiceRepository serviceRepository, FinancialService financialService)
        {
            _serviceRepository = serviceRepository;
            _financialService = financialService;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll()
        {
            var services = await _serviceRepository.GetAllAsync();
            return Ok(services);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Service>> GetById(int id)
        {
            var service = await _serviceRepository.GetByIdAsync(id);
            if (service == null)
                return NotFound(new { message = "Serviço não encontrado" });
            return Ok(service);
        }

        [HttpPost]
        public async Task<ActionResult<Service>> Create(Service service)
        {

            Console.WriteLine($"=== DEBUG ===");
            Console.WriteLine($"Recebeu foto? {(service.FotoServico != null ? "SIM" : "NÃO")}");
            Console.WriteLine($"Tamanho da foto: {service.FotoServico?.Length ?? 0}");
            Console.WriteLine($"==============");

            ModelState.Remove("Cliente");

            ModelState.Remove("Cliente");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (service.TemGarantia)
            {
                if (!service.FimGarantia.HasValue)
                    return BadRequest(new { message = "Informe a data de fim da garantia." });

                if (service.FimGarantia < service.DataServico)
                    return BadRequest(new { message = "A data de fim da garantia deve ser posterior à data do serviço." });
            }



            var created = await _serviceRepository.CreateAsync(service);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Service service)
        {
            if (id != service.Id)
                return BadRequest(new { message = "ID da URL não corresponde ao ID do serviço." });

            var existing = await _serviceRepository.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Serviço não encontrado." });

            if (service.TemGarantia && (!service.ComecoGarantia.HasValue || !service.FimGarantia.HasValue))
                return BadRequest(new { message = "Informe as datas de início e fim da garantia." });
            if (service.TemGarantia && service.FimGarantia < service.ComecoGarantia)
                return BadRequest(new { message = "A data de fim da garantia deve ser posterior à data de início." });

            await _serviceRepository.UpdateAsync(service);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _serviceRepository.DeleteAsync(id);
            if (!result)
                return NotFound(new { message = "Serviço não encontrado." });
            return NoContent();
        }

        [HttpGet("status/{status}")]
        public async Task<ActionResult> GetByStatus(string status)
        {
            var services = await _serviceRepository.GetByStatusAsync(status);
            return Ok(services);
        }

        [HttpGet("period")]
        public async Task<ActionResult> GetByDateRange(DateTime start, DateTime end)
        {
            var services = await _serviceRepository.GetByDateRangeAsync(start, end);
            return Ok(services);
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult> GetDashboard()
        {
            var today = DateTime.Now;
            var daily = await _financialService.GetDailySummaryAsync(today);
            var weekly = await _financialService.GetWeeklySummaryAsync();
            var monthly = await _financialService.GetMonthlySummaryAsync();
            return Ok(new { Daily = daily, Weekly = weekly, Monthly = monthly });
        }

        [HttpGet("financial/{period}")]
        public async Task<ActionResult> GetFinancialSummary(string period)
        {
            object result;
            switch (period.ToLower())
            {
                case "daily":
                    result = await _financialService.GetDailySummaryAsync(DateTime.Now);
                    break;
                case "weekly":
                    result = await _financialService.GetWeeklySummaryAsync();
                    break;
                case "monthly":
                    result = await _financialService.GetMonthlySummaryAsync();
                    break;
                case "yearly":
                    result = await _financialService.GetYearlySummaryAsync();
                    break;
                default:
                    return BadRequest(new { message = "Período inválido. Use daily, weekly, monthly ou yearly." });
            }
            return Ok(result);
        }
    }
}