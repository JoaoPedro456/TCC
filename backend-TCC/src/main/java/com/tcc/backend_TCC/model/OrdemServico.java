package com.tcc.backend_TCC.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.tcc.backend_TCC.enuns.StatusOS;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @ManyToMany
    @JoinTable(
            name = "os_itens_servico",
            joinColumns = @JoinColumn(name = "ordem_servico_id"),
            inverseJoinColumns = @JoinColumn(name = "item_servico_id")
    )
    @JsonIgnore
    private List<ItemServico> itensServico = new ArrayList<>();

    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<OrdemServicoMecanico> mecanicos = new ArrayList<>();
}