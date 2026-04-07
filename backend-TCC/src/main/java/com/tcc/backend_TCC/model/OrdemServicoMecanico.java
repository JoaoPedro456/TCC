package com.tcc.backend_TCC.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Data
public class OrdemServicoMecanico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ordem_servico_id")
    private OrdemServico ordemServico;

    @ManyToOne
    @JoinColumn(name = "mecanico_id")
    private Pessoa mecanico;

    private BigDecimal valorAtribuido; // Valor da parte desse mecânico
    private BigDecimal valorComissao;  // Comissão calculada automaticamente

    @PrePersist
    @PreUpdate
    public void calcularComissao() {
        if (this.mecanico != null && this.valorAtribuido != null) {
            Double percentual = this.mecanico.getPercentualComissao();
            if (percentual != null && percentual > 0) {
                BigDecimal taxa = new BigDecimal(percentual).divide(new BigDecimal("100"));
                this.valorComissao = this.valorAtribuido.multiply(taxa);
            } else {
                this.valorComissao = BigDecimal.ZERO;
            }
        }
    }
}