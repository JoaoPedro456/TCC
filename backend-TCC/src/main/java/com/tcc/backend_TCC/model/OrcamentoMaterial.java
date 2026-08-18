package com.tcc.backend_TCC.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Table(name = "orcamento_material")
@Data
public class OrcamentoMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orcamento_id", nullable = false)
    private Orcamento orcamento;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "material_id", nullable = true)
    private Material material;

    private String nomeMaterial; 

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal precoUnitario;

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal quantidade;

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal precoTotal;
}
