package com.tcc.backend_TCC.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Table(name = "ordem_servico_material")
@Data
public class OrdemServicoMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ordem_servico_id", nullable = false)
    private OrdemServico ordemServico;

    // Se o material for cadastrado, puxamos ele. Senão pode ser só o nome.
    // Mas conforme combinado, usaremos o catálogo obrigatório ou opcional.
    // Vamos permitir que o material venha do catálogo ou apenas digitado.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "material_id", nullable = true)
    private Material material;

    private String nomeMaterial; // Em caso de material customizado ou backup

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
