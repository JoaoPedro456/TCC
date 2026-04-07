package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.service.RelatorioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    @Autowired
    private RelatorioService service;

    // Relatório mensal de um funcionário
    @GetMapping("/funcionario/{id}")
    public Map<String, Object> relatorioFuncionario(
            @PathVariable Long id,
            @RequestParam String inicio,
            @RequestParam String fim
    ) {
        return service.relatorioFuncionario(id, LocalDate.parse(inicio), LocalDate.parse(fim));
    }

    // Relatório de todos os funcionários no período
    @GetMapping("/funcionarios")
    public List<Map<String, Object>> relatorioTodosFuncionarios(
            @RequestParam String inicio,
            @RequestParam String fim
    ) {
        return service.relatorioTodosFuncionarios(LocalDate.parse(inicio), LocalDate.parse(fim));
    }

    // Faturamento total da oficina no período
    @GetMapping("/faturamento")
    public Map<String, Object> faturamento(
            @RequestParam String inicio,
            @RequestParam String fim
    ) {
        return service.faturamentoPorPeriodo(LocalDate.parse(inicio), LocalDate.parse(fim));
    }
}