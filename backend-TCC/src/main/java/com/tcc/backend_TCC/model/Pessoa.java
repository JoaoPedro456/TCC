package com.tcc.backend_TCC.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Data
@SQLDelete(sql = "UPDATE pessoa SET ativo = false WHERE id=?")
@SQLRestriction("ativo = true")
public class Pessoa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo = true;

    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 2, max = 200, message = "Nome deve ter entre 2 e 200 caracteres")
    private String nome;

    // Adicionado: unique = true proíbe telefones repetidos no banco
    @Column(unique = true)
    @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres")
    @Pattern(regexp = "^[0-9\\-\\+\\(\\) ]*$", message = "Telefone contém caracteres inválidos")
    private String telefone;

    // CPF para pessoa física
    @Column(unique = true)
    @Size(max = 14, message = "CPF deve ter no máximo 14 caracteres")
    @Pattern(regexp = "^[0-9\\-\\.]*$", message = "CPF deve conter apenas números, traços e pontos")
    private String cpf;

    // CNPJ para pessoa jurídica
    @Column(unique = true)
    @Size(max = 18, message = "CNPJ deve ter no máximo 18 caracteres")
    @Pattern(regexp = "^[0-9\\-\\./]*$", message = "CNPJ deve conter apenas números, traços, pontos e barra")
    private String cnpj;

    @Size(max = 10, message = "CEP deve ter no máximo 10 caracteres")
    private String cep;

    @Size(max = 200, message = "Logradouro deve ter no máximo 200 caracteres")
    private String logradouro;

    @Size(max = 10, message = "Número deve ter no máximo 10 caracteres")
    private String numero;

    @Size(max = 100, message = "Complemento deve ter no máximo 100 caracteres")
    private String complemento;

    @Size(max = 40, message = "Bairro deve ter no máximo 40 caracteres")
    private String bairro;

    @Size(max = 50, message = "Cidade deve ter no máximo 50 caracteres")
    private String cidade;

    @Size(max = 2, message = "Estado deve ter no máximo 2 caracteres")
    private String estado;

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
