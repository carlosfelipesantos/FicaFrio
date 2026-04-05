using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RefrigeratorRepairSystem.Models
{
    [Table("Services")]
    public class Service
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Nome do cliente é obrigatório")]
        [MaxLength(100)]
        public string NomeCliente { get; set; }

        [Required]
        [MaxLength(20)]
        public string TelefoneCliente { get; set; }

        [Required]
        [MaxLength(200)]
        public string Endereco { get; set; }

        [Required]
        public string DescricaoServico { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Valor { get; set; }

        [Required]
        public DateTime DataServico { get; set; }

        // Adicione estas propriedades à classe Service existente
        public int ClienteId { get; set; }  // Chave estrangeira

        [ForeignKey("ClienteId")]
        public virtual Cliente Cliente { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } // Pendente, EmProgresso, Completo

        public bool TemGarantia { get; set; }

        public DateTime? ComecoGarantia { get; set; }

        public DateTime? FimGarantia { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.Now;

        public virtual ICollection<Gasto> Gastos { get; set; } = new List<Gasto>();

        public bool IsInWarranty()
        {
            if (!TemGarantia) return false;
            if (!FimGarantia.HasValue) return false;
            return DateTime.Now <= FimGarantia.Value;
        }
    }
}