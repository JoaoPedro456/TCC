package com.tcc.backend_TCC.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.validation.constraints.*;
import lombok.Data;
import jakarta.persistence.Id;

import java.math.BigDecimal;

@Entity
@Data
public class ItemServico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome do serviço é obrigatório")
    @Size(min = 2, max = 100, message = "Nome do serviço deve ter entre 2 e 100 caracteres")
    private String nomeServico;

    @NotNull(message = "Preço da tabela é obrigatório")
    @DecimalMin(value = "0.0", message = "Preço não pode ser negativo")
    @Digits(integer = 8, fraction = 2, message = "Preço deve ter no máximo 8 dígitos inteiros e 2 decimais")
    private BigDecimal precoTabela;
}