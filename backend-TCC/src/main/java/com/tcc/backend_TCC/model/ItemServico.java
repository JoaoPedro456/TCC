package com.tcc.backend_TCC.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;

@Entity
@Data
@SQLDelete(sql = "UPDATE item_servico SET ativo = false WHERE id=?")
public class ItemServico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    private Long id;

    @Column(nullable = false, columnDefinition = "boolean default true")
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    private Boolean ativo = true;

    @NotBlank(message = "Nome do serviço é obrigatório")
    @Size(min = 2, max = 100, message = "Nome do serviço deve ter entre 2 e 100 caracteres")
    private String nomeServico;

    @NotNull(message = "Preço da tabela é obrigatório")
    @DecimalMin(value = "0.0", message = "Preço não pode ser negativo")
    @Digits(integer = 8, fraction = 2, message = "Preço deve ter no máximo 8 dígitos inteiros e 2 decimais")
    private BigDecimal precoTabela;
}