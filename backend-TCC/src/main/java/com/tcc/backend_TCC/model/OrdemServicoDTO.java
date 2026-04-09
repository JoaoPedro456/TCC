package com.tcc.backend_TCC.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrdemServicoDTO {

    @NotNull(message = "Cliente é obrigatório")
    @Valid
    private ClienteDTO cliente;

    @Size(max = 500, message = "Observação deve ter no máximo 500 caracteres")
    private String observacao;

    @DecimalMin(value = "0.0", message = "Quilometragem não pode ser negativa")
    private Double quilometragem;

    @Size(max = 50, message = "Veículo deve ter no máximo 50 caracteres")
    private String veiculo;

    @NotNull(message = "Valor total é obrigatório")
    @DecimalMin(value = "0.0", message = "Valor total não pode ser negativo")
    private BigDecimal valorTotal;

    // Serviços são opcionais (pode ser uma OS apenas com descrição)
    private List<Long> itensServicoIds;

    @NotEmpty(message = "É necessário associar pelo menos um mecânico")
    private List<MecanicoDTO> mecanicos;

    @Data
    public static class ClienteDTO {
        @NotNull(message = "ID do cliente é obrigatório")
        private Long id;
    }

    @Data
    public static class MecanicoDTO {
        @NotNull(message = "Mecânico é obrigatório")
        @Valid
        private ClienteDTO mecanico;
    }
}
