package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.enuns.TipoLancamento;
import com.tcc.backend_TCC.model.Lancamento;
import com.tcc.backend_TCC.service.LancamentoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/financeiro")
public class LancamentoController {

    @Autowired
    private LancamentoService service;

    @GetMapping("/receber")
    public org.springframework.data.domain.Page<Lancamento> listarReceber(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String busca,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "vencimento", direction = org.springframework.data.domain.Sort.Direction.ASC) org.springframework.data.domain.Pageable pageable) {
        return service.pesquisar(TipoLancamento.RECEBER, status, busca, pageable);
    }

    @GetMapping("/pagar")
    public org.springframework.data.domain.Page<Lancamento> listarPagar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String busca,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "vencimento", direction = org.springframework.data.domain.Sort.Direction.ASC) org.springframework.data.domain.Pageable pageable) {
        return service.pesquisar(TipoLancamento.PAGAR, status, busca, pageable);
    }

    @PostMapping
    public ResponseEntity<Lancamento> criar(@Valid @RequestBody Lancamento lancamento) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(lancamento));
    }

    @PutMapping("/{id}/status")
    public Lancamento atualizarStatus(@PathVariable Long id, @RequestParam String status) {
        return service.atualizarStatus(id, status);
    }

    @PutMapping("/status-lote")
    public ResponseEntity<Void> atualizarStatusEmLote(@RequestBody List<Long> ids, @RequestParam String status) {
        service.atualizarStatusEmLote(ids, status);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resumo")
    public java.util.Map<String, java.math.BigDecimal> getResumoFinanceiro() {
        return service.getResumoFinanceiro();
    }
}