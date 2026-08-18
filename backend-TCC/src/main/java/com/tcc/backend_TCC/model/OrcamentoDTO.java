package com.tcc.backend_TCC.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrcamentoDTO {

    private ClienteDTO cliente;

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

    private List<OrcamentoItemDTO> itensServico;

    private List<OrcamentoMaterialDTO> materiais;

    @Data
    public static class ClienteDTO {
        private Long id;
    }

    @Data
    public static class OrcamentoItemDTO {
        // Se null, significa que é um serviço novo criado na hora
        private Long itemServicoId;

        // Se itemServicoId for null, descricaoServico é obrigatória para criar o serviço no catálogo
        @Size(max = 255, message = "Descrição do serviço muito longa")
        private String descricaoServico;

        @NotNull(message = "Preço cobrado é obrigatório")
        @DecimalMin(value = "0.0", message = "Preço cobrado não pode ser negativo")
        private BigDecimal precoCobrado;
    }

    @Data
    public static class OrcamentoMaterialDTO {
        private Long materialId;
        private String nomeMaterial;

        @NotNull(message = "Preço unitário é obrigatório")
        @DecimalMin(value = "0.0", message = "Preço unitário não pode ser negativo")
        private BigDecimal precoUnitario;

        @NotNull(message = "Quantidade é obrigatória")
        @DecimalMin(value = "0.0", message = "Quantidade não pode ser negativa")
        private BigDecimal quantidade;

        @NotNull(message = "Preço total é obrigatório")
        @DecimalMin(value = "0.0", message = "Preço total não pode ser negativo")
        private BigDecimal precoTotal;
    }
}
