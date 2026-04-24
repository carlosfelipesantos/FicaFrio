namespace FicaFrio.DTO
{
    public class RetornoDTO
    {
        public int ServiceId { get; set; }
        public string Motivo { get; set; } = string.Empty;
        public string Solucao { get; set; } = string.Empty;
        public decimal ValorGasto { get; set; }
        public DateTime DataRetorno { get; set; } = DateTime.Now;
    }
}