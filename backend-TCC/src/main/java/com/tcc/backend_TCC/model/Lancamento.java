package com.tcc.backend_TCC.model;

import com.tcc.backend_TCC.enuns.StatusLancamento;
import com.tcc.backend_TCC.enuns.TipoLancamento;
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
@Data
@SQLDelete(sql = "UPDATE lancamento SET ativo = false WHERE id=?")
@SQLRestriction("ativo = true")
public class Lancamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo = true;

    @NotBlank(message = "Descrição é obrigatória")
    private String descricao;

    // Pode ser o nome do cliente, do fornecedor, ou "Enel", "Sabesp", etc.
    @NotBlank(message = "Pessoa/Entidade relacionada é obrigatória")
    private String envolvido;

    @NotNull(message = "Valor é obrigatório")
    @DecimalMin(value = "0.1", message = "Valor deve ser maior que zero")
    private BigDecimal valor;

    @NotNull(message = "Data de vencimento é obrigatória")
    private LocalDate vencimento;

    @NotNull(message = "Tipo de lançamento é obrigatório")
    @Enumerated(EnumType.STRING)
    private TipoLancamento tipo;

    @NotNull(message = "Status é obrigatório")
    @Enumerated(EnumType.STRING)
    private StatusLancamento status = StatusLancamento.PENDENTE;
}