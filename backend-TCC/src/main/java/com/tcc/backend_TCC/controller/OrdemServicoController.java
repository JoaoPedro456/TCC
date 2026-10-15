package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.enuns.StatusOS;
import com.tcc.backend_TCC.model.BaixaLoteDTO;
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
import java.util.List;
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

    @PutMapping("/{id}")
    public ResponseEntity<OrdemServico> atualizar(
            @PathVariable @Min(value = 1, message = "ID inválido") Long id,
            @Valid @RequestBody OrdemServicoDTO dto) {
        return ResponseEntity.ok(service.atualizar(id, dto));
    }

    @GetMapping
    public Page<OrdemServico> listar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String busca,
            @PageableDefault(size = 20, sort = "id", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
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

    @PutMapping("/status-lote")
    public ResponseEntity<Void> atualizarStatusEmLote(
            @RequestBody @jakarta.validation.constraints.NotEmpty @jakarta.validation.constraints.Size(max = 100, message = "Máximo de 100 OS por lote") List<Long> ids,
            @RequestParam @NotBlank(message = "Status é obrigatório") String status) {
        service.atualizarStatusEmLote(ids, status);
        return ResponseEntity.noContent().build();
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

    @PostMapping("/pdf-lote")
    public ResponseEntity<byte[]> gerarPdfLote(@RequestBody @jakarta.validation.constraints.NotEmpty @jakarta.validation.constraints.Size(max = 100, message = "Máximo de 100 OS por lote") List<Long> ids) throws Exception {
        byte[] pdf = impressaoService.gerarPdfMultiplasOs(ids);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=OS_Notas_Selecionadas.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/cliente/{clienteId}/pdf-periodo")
    public ResponseEntity<byte[]> gerarPdfClientePeriodo(
            @PathVariable Long clienteId,
            @RequestParam int mes,
            @RequestParam int ano) throws Exception {
        LocalDate inicio = LocalDate.of(ano, mes, 1);
        LocalDate fim = inicio.withDayOfMonth(inicio.lengthOfMonth());
        byte[] pdf = impressaoService.gerarPdfOsClientePeriodo(clienteId, inicio, fim);
        String nomeArquivo = String.format("Notas_Cliente_%d_%02d_%d.pdf", clienteId, mes, ano);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + nomeArquivo)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PutMapping("/baixa-lote")
    public ResponseEntity<Void> darBaixaEmLote(@Valid @RequestBody BaixaLoteDTO dto) {
        service.darBaixaEmLote(dto);
        return ResponseEntity.noContent().build();
    }
}