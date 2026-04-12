using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RefrigeratorRepairSystem.Models
{
    [Table("Gastos")]
    public class Gasto
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ServiceId { get; set; }

        [Required]
        [MaxLength(50)]
        public string TipoDeGasto { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Descricacao { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Valor { get; set; }

        [Required]
        public DateTime DataGasto { get; set; }

        [ForeignKey("ServiceId")]
       
        public virtual Service? Service { get; set; }
    }
}