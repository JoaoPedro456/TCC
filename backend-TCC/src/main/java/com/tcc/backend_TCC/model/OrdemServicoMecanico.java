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
    @com.fasterxml.jackson.annotation.JsonIgnore
    private OrdemServico ordemServico;

    @ManyToOne
    @JoinColumn(name = "mecanico_id")
    private Pessoa mecanico;

    private BigDecimal valorAtribuido; // Valor da parte desse mecânico
    private BigDecimal valorComissao;  // Comissão calculada automaticamente

    @PrePersist
    @PreUpdate
    public void calcularComissao() {
        this.valorComissao = this.valorAtribuido != null ? this.valorAtribuido : BigDecimal.ZERO;
    }
}