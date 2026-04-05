using FicaFrio.Repositories;
using Microsoft.AspNetCore.Mvc;
using RefrigeratorRepairSystem.Models;
using RefrigeratorRepairSystem.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RefrigeratorRepairSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientesController : ControllerBase
    {
        private readonly IClienteRepository _clienteRepository;

        public ClientesController(IClienteRepository clienteRepository)
        {
            _clienteRepository = clienteRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cliente>>> GetAll()
        {
            var clientes = await _clienteRepository.GetAllAsync();
            return Ok(clientes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Cliente>> GetById(int id)
        {
            var cliente = await _clienteRepository.GetClienteWithServicosAsync(id);
            if (cliente == null)
                return NotFound();
            return Ok(cliente);
        }

        [HttpPost]
        public async Task<ActionResult<Cliente>> Create(Cliente cliente)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _clienteRepository.CreateAsync(cliente);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Cliente cliente)
        {
            if (id != cliente.Id)
                return BadRequest();

            await _clienteRepository.UpdateAsync(cliente);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _clienteRepository.DeleteAsync(id);
            if (!result)
                return NotFound();
            return NoContent();
        }

        [HttpGet("search/{term}")]
        public async Task<ActionResult<IEnumerable<Cliente>>> Search(string term)
        {
            var clientes = await _clienteRepository.SearchAsync(term);
            return Ok(clientes);
        }
    }
}