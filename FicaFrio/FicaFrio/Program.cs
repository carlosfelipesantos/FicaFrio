using FicaFrio.Repositories;
using Microsoft.EntityFrameworkCore;
using RefrigeratorRepairSystem.Data;
using RefrigeratorRepairSystem.Repositories;
using RefrigeratorRepairSystem.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configurar CORS para permitir frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

// Configurar banco de dados SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// INJETAR DEPENDÊNCIAS - Repositories
builder.Services.AddScoped<IServiceRepository, ServiceRepository>();
builder.Services.AddScoped<IGastosRepository, GastosRepository>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();

// INJETAR DEPENDÊNCIAS - Services
builder.Services.AddScoped<FinancialService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();