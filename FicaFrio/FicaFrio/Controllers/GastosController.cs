using FicaFrio.DTO;
using FicaFrio.Repositories;
using Microsoft.AspNetCore.Mvc;
using RefrigeratorRepairSystem.Models;

namespace FicaFrio.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GastosController : ControllerBase
    {
        private readonly IGastosRepository _gastosRepository;

        public GastosController(IGastosRepository gastosRepository)
        {
            _gastosRepository = gastosRepository;
        }

        [HttpGet("obter/{id}")]
        public async Task<ActionResult<Gasto>> GetGastoPorId(int id)
        {
            var gasto = await _gastosRepository.GetByIdAsync(id);
            if (gasto == null) return NotFound();
            return Ok(gasto);
        }

        [HttpPost("retorno")]
        public async Task<ActionResult<Gasto>> CriarRetorno(RetornoDTO dto)
        {
            if (dto.ServiceId <= 0)
                return BadRequest(new { message = "Informe o serviço do retorno." });

            if (string.IsNullOrWhiteSpace(dto.Motivo))
                return BadRequest(new { message = "Informe o motivo do retorno." });

            var descricao = $"Retorno/Garantia - Motivo: {dto.Motivo}";

            if (!string.IsNullOrWhiteSpace(dto.Solucao))
                descricao += $" | Solução: {dto.Solucao}";

            var gasto = new Gasto
            {
                ServiceId = dto.ServiceId,
                TipoDeGasto = "Retorno",
                Descricacao = descricao,
                Valor = dto.ValorGasto,
                DataGasto = dto.DataRetorno
            };

            var created = await _gastosRepository.CreateAsync(gasto);

            return CreatedAtAction(nameof(GetGastoPorId), new { id = created.Id }, created);
        }

        [HttpPost]
        public async Task<ActionResult<Gasto>> CreateExpense(Gasto gasto)
        {
           
            ModelState.Remove("Service");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _gastosRepository.CreateAsync(gasto);
            return CreatedAtAction(nameof(GetGastoPorId), new { id = created.Id }, created);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Gasto>> GetExpense(int id)
        {
            var expenses = await _gastosRepository.GetByServiceIdAsync(id);
            return Ok(expenses);
        }

        [HttpGet("service/{serviceId}")]
        public async Task<ActionResult<IEnumerable<Gasto>>> GetServiceExpenses(int serviceId)
        {
            var expenses = await _gastosRepository.GetByServiceIdAsync(serviceId);
            return Ok(expenses);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            var result = await _gastosRepository.DeleteAsync(id);
            if (!result)
                return NotFound();
            return NoContent();
        }
    }
}