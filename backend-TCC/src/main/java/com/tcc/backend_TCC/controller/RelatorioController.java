package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.service.RelatorioService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/relatorios")
@Validated
public class RelatorioController {

    @Autowired
    private RelatorioService service;

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
}