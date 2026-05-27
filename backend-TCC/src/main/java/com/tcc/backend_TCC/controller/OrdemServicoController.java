package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.enuns.StatusOS;
import com.tcc.backend_TCC.model.OrdemServico;
import com.tcc.backend_TCC.model.OrdemServicoDTO;
import com.tcc.backend_TCC.service.ImpressaoService;
import com.tcc.backend_TCC.service.OrdemServicoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

@RestController
@RequestMapping("/api/ordens")
@Validated
public class OrdemServicoController {

    @Autowired
    private OrdemServicoService service;

    @Autowired
    private ImpressaoService impressaoService;

    @PostMapping
    public ResponseEntity<OrdemServico> criar(@Valid @RequestBody OrdemServicoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.salvar(dto));
    }

    @GetMapping
    public Page<OrdemServico> listar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String busca,
            @PageableDefault(size = 20) Pageable pageable) {
        StatusOS statusEnum = null;
        if (status != null && !status.isBlank() && !"TODOS".equals(status)) {
            statusEnum = StatusOS.valueOf(status);
        }
        return service.pesquisar(statusEnum, busca, pageable);
    }

    @GetMapping("/{id}")
    public OrdemServico buscar(@PathVariable @Min(value = 1, message = "ID inválido") Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}/status")
    public OrdemServico atualizarStatus(
            @PathVariable @Min(value = 1, message = "ID inválido") Long id,
            @RequestParam @NotBlank(message = "Status é obrigatório") String status) {
        return service.atualizarStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable @Min(value = 1, message = "ID inválido") Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/comissao/{id}")
    public ResponseEntity<BigDecimal> verComissao(
            @PathVariable @Min(value = 1, message = "ID inválido") Long id,
            @RequestParam @NotBlank(message = "Data início é obrigatória") String inicio,
            @RequestParam @NotBlank(message = "Data fim é obrigatória") String fim) {
        BigDecimal comissao = service.calcularTotalComissaoMecanico(id, LocalDate.parse(inicio), LocalDate.parse(fim));
        return ResponseEntity.ok(comissao);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> gerarPdf(@PathVariable Long id) throws Exception {
        byte[] pdf = impressaoService.gerarPdfOs(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=OS_" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}