package com.tcc.backend_TCC.model;

import com.tcc.backend_TCC.enuns.UnidadeMedida;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MaterialDTO {

    private Long id;

    @NotBlank(message = "Nome do material é obrigatório")
    private String nomeMaterial;

    @NotNull(message = "Unidade de medida é obrigatória")
    private UnidadeMedida unidadeMedida;

    @NotNull(message = "Preço de tabela é obrigatório")
    @DecimalMin(value = "0.0", message = "Preço de tabela não pode ser negativo")
    private BigDecimal precoTabela;
}
