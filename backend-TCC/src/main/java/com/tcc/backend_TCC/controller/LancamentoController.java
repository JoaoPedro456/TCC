package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.enuns.StatusLancamento;
import com.tcc.backend_TCC.enuns.TipoLancamento;
import com.tcc.backend_TCC.model.Lancamento;
import com.tcc.backend_TCC.repository.LancamentoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/financeiro")
@CrossOrigin(origins = "*")
public class LancamentoController {

    @Autowired
    private LancamentoRepository repository;

    @GetMapping("/receber")
    public List<Lancamento> listarReceber() {
        return repository.findByTipoOrderByVencimentoAsc(TipoLancamento.RECEBER);
    }

    @GetMapping("/pagar")
    public List<Lancamento> listarPagar() {
        return repository.findByTipoOrderByVencimentoAsc(TipoLancamento.PAGAR);
    }

    @PostMapping
    public ResponseEntity<Lancamento> criar(@Valid @RequestBody Lancamento lancamento) {
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(lancamento));
    }

    @PutMapping("/{id}/status")
    public Lancamento atualizarStatus(@PathVariable Long id, @RequestParam String status) {
        Lancamento lancamento = repository.findById(id).orElseThrow();
        lancamento.setStatus(StatusLancamento.valueOf(status));
        return repository.save(lancamento);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}