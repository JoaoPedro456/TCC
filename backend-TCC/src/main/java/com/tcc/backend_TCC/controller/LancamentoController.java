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
    public List<Lancamento> listarReceber() {
        return service.listarPorTipo(TipoLancamento.RECEBER);
    }

    @GetMapping("/pagar")
    public List<Lancamento> listarPagar() {
        return service.listarPorTipo(TipoLancamento.PAGAR);
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
}