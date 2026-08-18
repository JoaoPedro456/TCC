package com.tcc.backend_TCC.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Data
@Table(name = "orcamento_item")
public class OrcamentoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "orcamento_id", nullable = false)
    @JsonIgnore
    private Orcamento orcamento;

    @ManyToOne
    @JoinColumn(name = "item_servico_id", nullable = false)
    private ItemServico itemServico;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precoCobrado;
}
