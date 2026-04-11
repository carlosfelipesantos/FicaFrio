namespace FicaFrio.Controllers
{
    using RefrigeratorRepairSystem.Models;
    using RefrigeratorRepairSystem.Repositories;
    using RefrigeratorRepairSystem.Services;
    using Microsoft.AspNetCore.Mvc;
    using System;
    using System.Threading.Tasks;

    namespace FicaFrio.Controllers
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

            // GET: api/services
            [HttpGet]
            public async Task<ActionResult> GetAll()
            {
                var services = await _serviceRepository.GetAllAsync();
                return Ok(services);
            }

            // GET: api/services/{id}
            [HttpGet("{id}")]
            public async Task<ActionResult<Service>> GetById(int id)
            {
                var service = await _serviceRepository.GetByIdAsync(id);
                if (service == null)
                    return NotFound(new { message = "Serviço não encontrado" });

                return Ok(service);
            }

            // POST: api/services
            [HttpPost]
            public async Task<ActionResult<Service>> Create(Service service)
            {
                ModelState.Remove("Cliente");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Validação básica de garantia
                if (service.TemGarantia)
                {
                    if (!service.ComecoGarantia.HasValue || !service.FimGarantia.HasValue)
                        return BadRequest(new { message = "Informe as datas de início e fim da garantia." });
                    if (service.FimGarantia < service.ComecoGarantia)
                        return BadRequest(new { message = "A data de fim da garantia deve ser posterior à data de início." });
                }

                var created = await _serviceRepository.CreateAsync(service);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }

            // PUT: api/services/{id}
            [HttpPut("{id}")]
            public async Task<IActionResult> Update(int id, Service service)
            {
                if (id != service.Id)
                    return BadRequest(new { message = "ID da URL não corresponde ao ID do serviço." });

                var existing = await _serviceRepository.GetByIdAsync(id);
                if (existing == null)
                    return NotFound(new { message = "Serviço não encontrado." });

                // Validação de garantia
                if (service.TemGarantia && (!service.ComecoGarantia.HasValue || !service.FimGarantia.HasValue))
                    return BadRequest(new { message = "Informe as datas de início e fim da garantia." });
                if (service.TemGarantia && service.FimGarantia < service.ComecoGarantia)
                    return BadRequest(new { message = "A data de fim da garantia deve ser posterior à data de início." });

                await _serviceRepository.UpdateAsync(service);
                return NoContent();
            }

            // DELETE: api/services/{id}
            [HttpDelete("{id}")]
            public async Task<IActionResult> Delete(int id)
            {
                var result = await _serviceRepository.DeleteAsync(id);
                if (!result)
                    return NotFound(new { message = "Serviço não encontrado." });

                return NoContent();
            }

            // GET: api/services/status/{status}
            [HttpGet("status/{status}")]
            public async Task<ActionResult> GetByStatus(string status)
            {
                var services = await _serviceRepository.GetByStatusAsync(status);
                return Ok(services);
            }

            // GET: api/services/period?start=yyyy-mm-dd&end=yyyy-mm-dd
            [HttpGet("period")]
            public async Task<ActionResult> GetByDateRange(DateTime start, DateTime end)
            {
                var services = await _serviceRepository.GetByDateRangeAsync(start, end);
                return Ok(services);
            }

            // GET: api/services/dashboard
            [HttpGet("dashboard")]
            public async Task<ActionResult> GetDashboard()
            {
                var today = DateTime.Now;
                var daily = await _financialService.GetDailySummaryAsync(today);
                var weekly = await _financialService.GetWeeklySummaryAsync();
                var monthly = await _financialService.GetMonthlySummaryAsync();

                return Ok(new { Daily = daily, Weekly = weekly, Monthly = monthly });
            }

            // GET: api/services/financial/{period}   (period = daily, weekly, monthly, yearly)
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
}
