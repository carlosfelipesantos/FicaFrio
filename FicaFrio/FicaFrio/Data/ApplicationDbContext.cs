using Microsoft.EntityFrameworkCore;
using RefrigeratorRepairSystem.Models;
using System.Reflection.Emit;

namespace RefrigeratorRepairSystem.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Service> Services { get; set; }
        public DbSet<Gasto> Gastos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurar índices para melhor performance
            modelBuilder.Entity<Service>()
                .HasIndex(s => s.DataServico);

            modelBuilder.Entity<Service>()
                .HasIndex(s => s.Status);

            modelBuilder.Entity<Service>()
                .HasIndex(s => s.NomeCliente);


                    modelBuilder.Entity<Service>()
                .HasMany(s => s.Gastos)
                .WithOne(g => g.Service)
                .HasForeignKey(g => g.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);

        }
    }
}