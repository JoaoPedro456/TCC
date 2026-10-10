package com.tcc.backend_TCC.model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class BaixaLoteDTO {
    private List<Long> ids;
    private BigDecimal descontoTotal;
    private List<ItemBaixaDTO> itens;
    private LocalDate dataPagamento;
    private String formaPagamento;

    // Pagamento Parcial (Abatimento em Lote)
    private Boolean pagamentoParcial;
    private BigDecimal valorRecebidoParcial;
    private LocalDate novoVencimentoRestante;

    @Data
    public static class ItemBaixaDTO {
        private Long id;
        private BigDecimal desconto;
        private BigDecimal valorPago;
    }
}
