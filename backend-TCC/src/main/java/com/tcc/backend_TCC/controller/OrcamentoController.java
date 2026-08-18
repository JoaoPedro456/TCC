package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.enuns.StatusOrcamento;
import com.tcc.backend_TCC.model.Orcamento;
import com.tcc.backend_TCC.model.OrcamentoDTO;
import com.tcc.backend_TCC.model.OrdemServico;
import com.tcc.backend_TCC.service.ImpressaoService;
import com.tcc.backend_TCC.service.OrcamentoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orcamentos")
@Validated
public class OrcamentoController {

    @Autowired
    private OrcamentoService service;

    @Autowired
    private ImpressaoService impressaoService;

    @PostMapping
    public ResponseEntity<Orcamento> criar(@Valid @RequestBody OrcamentoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.salvar(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Orcamento> atualizar(
            @PathVariable @Min(value = 1, message = "ID inválido") Long id,
            @Valid @RequestBody OrcamentoDTO dto) {
        return ResponseEntity.ok(service.atualizar(id, dto));
    }

    @GetMapping
    public Page<Orcamento> listar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String busca,
            @PageableDefault(size = 20) Pageable pageable) {
        StatusOrcamento statusEnum = null;
        if (status != null && !status.isBlank() && !"TODOS".equals(status)) {
            statusEnum = StatusOrcamento.valueOf(status);
        }
        return service.pesquisar(statusEnum, busca, pageable);
    }

    @GetMapping("/{id}")
    public Orcamento buscar(@PathVariable @Min(value = 1, message = "ID inválido") Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}/status")
    public Orcamento atualizarStatus(
            @PathVariable @Min(value = 1, message = "ID inválido") Long id,
            @RequestParam @NotBlank(message = "Status é obrigatório") String status) {
        return service.atualizarStatus(id, status);
    }

    @PostMapping("/{id}/aprovar")
    public ResponseEntity<OrdemServico> aprovarEGerarOS(@PathVariable @Min(value = 1, message = "ID inválido") Long id) {
        return ResponseEntity.ok(service.aprovarEGerarOS(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable @Min(value = 1, message = "ID inválido") Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> gerarPdf(@PathVariable Long id) throws Exception {
        // Aproveitaremos a estrutura de PDF da OS
        byte[] pdf = impressaoService.gerarPdfOrcamento(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Orcamento_" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
