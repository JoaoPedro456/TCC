package com.tcc.backend_TCC.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

@Entity
@Data
public class Pessoa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 2, max = 200, message = "Nome deve ter entre 2 e 200 caracteres")
    private String nome;

    // Adicionado: unique = true proíbe telefones repetidos no banco
    @Column(unique = true)
    @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres")
    @Pattern(regexp = "^[0-9\\-\\+\\(\\) ]*$", message = "Telefone contém caracteres inválidos")
    private String telefone;

    // Adicionado: unique = true proíbe CPFs repetidos no banco
    @Column(unique = true)
    @Size(max = 14, message = "CPF deve ter no máximo 14 caracteres")
    @Pattern(regexp = "^[0-9\\-\\.]*$", message = "CPF deve conter apenas números, traços e pontos")
    private String cpf;

    @Size(max = 200, message = "Endereço deve ter no máximo 200 caracteres")
    private String endereco;

    @NotNull(message = "Tipo da pessoa é obrigatório")
    @Enumerated(EnumType.STRING)
    private TipoPessoa tipo;

    // Campos apenas para funcionários
    @Size(max = 50, message = "Cargo deve ter no máximo 50 caracteres")
    private String cargo;

    @DecimalMin(value = "0.0", message = "Salário base não pode ser negativo")
    private Double salarioBase;

    @DecimalMin(value = "0.0", message = "Percentual de comissão não pode ser negativo")
    @DecimalMax(value = "100.0", message = "Percentual de comissão não pode exceder 100%")
    private Double percentualComissao;
}