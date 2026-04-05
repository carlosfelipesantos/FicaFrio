using FicaFrio.Repositories;
using Microsoft.EntityFrameworkCore;
using RefrigeratorRepairSystem.Data;
using RefrigeratorRepairSystem.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RefrigeratorRepairSystem.Repositories
{
    public class ClienteRepository : IClienteRepository
    {
        private readonly ApplicationDbContext _context;

        public ClienteRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Cliente>> GetAllAsync()
        {
            return await _context.Clientes
                .OrderBy(c => c.Nome)
                .ToListAsync();
        }

        public async Task<Cliente> GetByIdAsync(int id)
        {
            return await _context.Clientes
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Cliente> GetClienteWithServicosAsync(int id)
        {
            return await _context.Clientes
                .Include(c => c.Servicos)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Cliente> CreateAsync(Cliente cliente)
        {
            cliente.DataCadastro = DateTime.Now;
            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();
            return cliente;
        }

        public async Task<Cliente> UpdateAsync(Cliente cliente)
        {
            _context.Entry(cliente).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return cliente;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return false;

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Cliente>> SearchAsync(string term)
        {
            return await _context.Clientes
                .Where(c => c.Nome.Contains(term) ||
                           c.Telefone.Contains(term) ||
                           c.Endereco.Contains(term))
                .OrderBy(c => c.Nome)
                .ToListAsync();
        }
    }
}