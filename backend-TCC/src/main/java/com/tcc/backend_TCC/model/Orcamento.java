package com.tcc.backend_TCC.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.tcc.backend_TCC.enuns.StatusOrcamento;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orcamento", indexes = {
    @Index(name = "idx_orc_status", columnList = "status"),
    @Index(name = "idx_orc_data_registo", columnList = "dataRegisto"),
    @Index(name = "idx_orc_ativo", columnList = "ativo")
})
@Data
@SQLDelete(sql = "UPDATE orcamento SET ativo = false WHERE id=?")
@SQLRestriction("ativo = true")
public class Orcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo = true;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = true)
    private Pessoa cliente;

    private LocalDate dataRegisto = LocalDate.now();

    @Size(max = 500, message = "Observação deve ter no máximo 500 caracteres")
    private String observacao;

    @Size(max = 100, message = "Veículo deve ter no máximo 100 caracteres")
    private String veiculo;

    @DecimalMin(value = "0.0", message = "Quilometragem não pode ser negativa")
    private Double quilometragem;

    @DecimalMin(value = "0.0", message = "Valor do KM não pode ser negativo")
    private BigDecimal valorKm;

    @DecimalMin(value = "0.0", message = "Desconto não pode ser negativo")
    private BigDecimal valorDesconto;

    @NotNull(message = "Valor total é obrigatório")
    @DecimalMin(value = "0.0", message = "Valor total não pode ser negativo")
    private BigDecimal valorTotal;

    @NotNull(message = "Status é obrigatório")
    @Enumerated(EnumType.STRING)
    private StatusOrcamento status = StatusOrcamento.PENDENTE;

    @org.hibernate.annotations.BatchSize(size = 50)
    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrcamentoItem> itensServico = new ArrayList<>();

    @org.hibernate.annotations.BatchSize(size = 50)
    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrcamentoMaterial> materiais = new ArrayList<>();
}
