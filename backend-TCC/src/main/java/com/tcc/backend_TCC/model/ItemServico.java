package com.tcc.backend_TCC.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.Data;
import jakarta.persistence.Id;

import java.math.BigDecimal;

@Entity
@Data
public class ItemServico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeServico; // Ex: "Alinhamento"
    private BigDecimal precoTabela; // Preço pré-definido
}