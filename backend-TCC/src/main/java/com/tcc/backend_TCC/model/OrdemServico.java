package com.tcc.backend_TCC.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.tcc.backend_TCC.enuns.StatusOS;
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
@Table(name = "ordem_servico", indexes = {
    @Index(name = "idx_os_status", columnList = "status"),
    @Index(name = "idx_os_data_registo", columnList = "dataRegisto"),
    @Index(name = "idx_os_ativo", columnList = "ativo")
})
@Data
@SQLDelete(sql = "UPDATE ordem_servico SET ativo = false WHERE id=?")
@SQLRestriction("ativo = true")
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo = true;

    @NotNull(message = "Cliente é obrigatório")
    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Pessoa cliente;

    private LocalDate dataRegisto = LocalDate.now();

    @Size(max = 500, message = "Observação deve ter no máximo 500 caracteres")
    private String observacao;

    @Size(max = 100, message = "Veículo deve ter no máximo 100 caracteres")
    private String veiculo;

    @DecimalMin(value = "0.0", message = "Quilometragem não pode ser negativa")
    private Double quilometragem;

    // --- NOVO CAMPO: Valor cobrado por KM ---
    @DecimalMin(value = "0.0", message = "Valor do KM não pode ser negativo")
    private BigDecimal valorKm;

    @NotNull(message = "Valor total é obrigatório")
    @DecimalMin(value = "0.0", message = "Valor total não pode ser negativo")
    private BigDecimal valorTotal;

    @NotNull(message = "Status é obrigatório")
    @Enumerated(EnumType.STRING)
    private StatusOS status = StatusOS.ABERTA;

    @org.hibernate.annotations.BatchSize(size = 50)
    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrdemServicoItem> itensServico = new ArrayList<>();

    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<OrdemServicoMecanico> mecanicos = new ArrayList<>();
}