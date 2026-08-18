package com.tcc.backend_TCC.model;

import com.tcc.backend_TCC.enuns.UnidadeMedida;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "material", indexes = {
    @Index(name = "idx_material_ativo", columnList = "ativo")
})
@Data
@SQLDelete(sql = "UPDATE material SET ativo = false WHERE id=?")
@SQLRestriction("ativo = true")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo = true;

    @NotBlank(message = "Nome do material é obrigatório")
    private String nomeMaterial;

    @NotNull(message = "Unidade de medida é obrigatória")
    @Enumerated(EnumType.STRING)
    private UnidadeMedida unidadeMedida;

    @NotNull(message = "Preço de tabela é obrigatório")
    @DecimalMin(value = "0.0", message = "Preço de tabela não pode ser negativo")
    private BigDecimal precoTabela;
    
    private LocalDate dataRegisto = LocalDate.now();
}
