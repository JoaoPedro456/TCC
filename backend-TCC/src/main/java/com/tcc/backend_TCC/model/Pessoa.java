package com.tcc.backend_TCC.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Pessoa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String telefone;
    private String cpf;
    private String endereco;

    @Enumerated(EnumType.STRING)
    private TipoPessoa tipo;

    // Campos apenas para funcionários
    private String cargo;
    private Double salarioBase;
    private Double percentualComissao;
}