package com.tcc.backend_TCC.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class BaixaLoteDTO {
    @NotEmpty(message = "A lista de IDs não pode ser vazia")
    @Size(max = 100, message = "Máximo de 100 contas por lote")
    private List<Long> ids;

    @DecimalMin(value = "0.0", message = "Desconto total não pode ser negativo")
    private BigDecimal descontoTotal;

    @Valid
    private List<@Valid ItemBaixaDTO> itens;

    private LocalDate dataPagamento;
    private String formaPagamento;

    // Pagamento Parcial (Abatimento em Lote)
    private Boolean pagamentoParcial;

    @DecimalMin(value = "0.01", message = "Valor parcial deve ser positivo")
    private BigDecimal valorRecebidoParcial;

    private LocalDate novoVencimentoRestante;

    @Data
    public static class ItemBaixaDTO {
        @NotNull(message = "ID do item é obrigatório")
        private Long id;

        @DecimalMin(value = "0.0", message = "Desconto não pode ser negativo")
        private BigDecimal desconto;

        @DecimalMin(value = "0.0", message = "Valor pago não pode ser negativo")
        private BigDecimal valorPago;
    }
}
