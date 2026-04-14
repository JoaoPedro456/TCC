package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.OrdemServicoMecanico;
import com.tcc.backend_TCC.repository.OrdemServicoMecanicoRepository;
import com.tcc.backend_TCC.service.ImpressaoService;
import com.tcc.backend_TCC.service.RelatorioService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/relatorios")
@Validated
public class RelatorioController {

    @Autowired
    private ImpressaoService impressaoService;

    @Autowired
    private RelatorioService service;

    // Adicionámos o repositório para conseguir somar as comissões!
    @Autowired
    private OrdemServicoMecanicoRepository mecanicoRepository;

    // Relatório mensal de um funcionário
    @GetMapping("/funcionario/{id}")
    public Map<String, Object> relatorioFuncionario(
            @PathVariable Long id,
            @RequestParam @NotBlank(message = "Data início é obrigatória") String inicio,
            @RequestParam @NotBlank(message = "Data fim é obrigatória") String fim
    ) {
        return service.relatorioFuncionario(id, LocalDate.parse(inicio), LocalDate.parse(fim));
    }

    // Relatório de todos os funcionários no período
    @GetMapping("/funcionarios")
    public List<Map<String, Object>> relatorioTodosFuncionarios(
            @RequestParam @NotBlank(message = "Data início é obrigatória") String inicio,
            @RequestParam @NotBlank(message = "Data fim é obrigatória") String fim
    ) {
        return service.relatorioTodosFuncionarios(LocalDate.parse(inicio), LocalDate.parse(fim));
    }

    // Faturamento total da oficina no período
    @GetMapping("/faturamento")
    public Map<String, Object> faturamento(
            @RequestParam @NotBlank(message = "Data início é obrigatória") String inicio,
            @RequestParam @NotBlank(message = "Data fim é obrigatória") String fim
    ) {
        return service.faturamentoPorPeriodo(LocalDate.parse(inicio), LocalDate.parse(fim));
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return service.dashboard();
    }

    // 👇 ROTA 1: PARA O BOTÃO "CALCULAR" (Devolve apenas o valor somado)
    @GetMapping("/comissao-resumo")
    public ResponseEntity<Map<String, Object>> getResumoComissao(
            @RequestParam Long funcionarioId,
            @RequestParam String inicio,
            @RequestParam String fim) {

        LocalDate dataInicio = LocalDate.parse(inicio);
        LocalDate dataFim = LocalDate.parse(fim);

        List<OrdemServicoMecanico> participacoes = mecanicoRepository.buscarComissoesMes(funcionarioId, dataInicio, dataFim);

        BigDecimal totalComissao = BigDecimal.ZERO;
        for (OrdemServicoMecanico p : participacoes) {
            if (p.getValorAtribuido() != null) {
                totalComissao = totalComissao.add(p.getValorAtribuido());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalComissao", totalComissao);
        return ResponseEntity.ok(response);
    }

    // 👇 ROTA 2: PARA O BOTÃO "IMPRIMIR" (Devolve o PDF)
    @GetMapping("/comissao-detalhada")
    public ResponseEntity<byte[]> gerarPdfComissao(
            @RequestParam Long funcionarioId,
            @RequestParam String inicio,
            @RequestParam String fim) throws Exception {

        byte[] pdf = impressaoService.gerarPdfComissao(funcionarioId,
                LocalDate.parse(inicio), LocalDate.parse(fim));

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .body(pdf);
    }
}