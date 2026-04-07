package com.tcc.backend_TCC.model;

import com.tcc.backend_TCC.enuns.StatusOS;
import jakarta.persistence.*;
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

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Pessoa cliente;

    private LocalDate dataRegisto = LocalDate.now();
    private String observacao;
    private Double quilometragem;
    private BigDecimal valorTotal;

    @Enumerated(EnumType.STRING)
    private StatusOS status = StatusOS.ABERTA;

    // Lista de serviços do catálogo selecionados
    @ManyToMany
    @JoinTable(
            name = "os_itens_servico",
            joinColumns = @JoinColumn(name = "ordem_servico_id"),
            inverseJoinColumns = @JoinColumn(name = "item_servico_id")
    )
    private List<ItemServico> itensServico = new ArrayList<>();

    // Lista de mecânicos envolvidos
    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrdemServicoMecanico> mecanicos = new ArrayList<>();
}