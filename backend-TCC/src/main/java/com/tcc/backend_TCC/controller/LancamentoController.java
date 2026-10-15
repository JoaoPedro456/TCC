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

import com.tcc.backend_TCC.model.BaixaLancamentoDTO;
import com.tcc.backend_TCC.model.BaixaLoteDTO;

@RestController
@RequestMapping("/api/financeiro")
@org.springframework.validation.annotation.Validated
public class LancamentoController {

    @Autowired
    private LancamentoService service;

    @GetMapping("/receber")
    public org.springframework.data.domain.Page<Lancamento> listarReceber(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String busca,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "id", direction = org.springframework.data.domain.Sort.Direction.DESC) org.springframework.data.domain.Pageable pageable) {
        return service.pesquisar(TipoLancamento.RECEBER, status, busca, pageable);
    }

    @GetMapping("/pagar")
    public org.springframework.data.domain.Page<Lancamento> listarPagar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String busca,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "id", direction = org.springframework.data.domain.Sort.Direction.DESC) org.springframework.data.domain.Pageable pageable) {
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

    @PutMapping("/{id}/baixa")
    public Lancamento darBaixa(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) BaixaLancamentoDTO dto) {
        return service.darBaixa(id, dto);
    }

    @PutMapping("/status-lote")
    public ResponseEntity<Void> atualizarStatusEmLote(
            @RequestBody @jakarta.validation.constraints.NotEmpty @jakarta.validation.constraints.Size(max = 100, message = "Máximo de 100 itens por lote") List<Long> ids,
            @RequestParam String status) {
        service.atualizarStatusEmLote(ids, status);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/baixa-lote")
    public ResponseEntity<Void> darBaixaEmLote(@Valid @RequestBody BaixaLoteDTO dto) {
        service.darBaixaEmLoteComDesconto(dto);
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