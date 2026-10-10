package com.tcc.backend_TCC.model;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BaixaLancamentoDTO {

    @DecimalMin(value = "0.0", message = "Desconto não pode ser negativo")
    private BigDecimal desconto;

    @DecimalMin(value = "0.0", message = "Valor pago não pode ser negativo")
    private BigDecimal valorPago;

    private LocalDate dataPagamento;

    private String formaPagamento;

    private String observacao;

    // Pagamento Parcial
    private Boolean pagamentoParcial;

    private BigDecimal valorRecebidoParcial;

    private LocalDate novoVencimentoRestante;
}
