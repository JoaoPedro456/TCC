package com.tcc.backend_TCC.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Data
@Table(name = "ordem_servico_item")
public class OrdemServicoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ordem_servico_id", nullable = false)
    @JsonIgnore
    private OrdemServico ordemServico;

    @ManyToOne
    @JoinColumn(name = "item_servico_id", nullable = false)
    private ItemServico itemServico;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precoCobrado;
}
