package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.OrdemServico;
import com.tcc.backend_TCC.service.OrdemServicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/ordens")
public class OrdemServicoController {

    @Autowired
    private OrdemServicoService service;

    @PostMapping
    public OrdemServico criar(@RequestBody OrdemServico os) {
        return service.salvar(os);
    }

    @GetMapping
    public List<OrdemServico> listar() {
        return service.listarTodas();
    }

    @GetMapping("/{id}")
    public OrdemServico buscar(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}/status")
    public OrdemServico atualizarStatus(@PathVariable Long id, @RequestParam String status) {
        return service.atualizarStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }

    @GetMapping("/comissao/{id}")
    public BigDecimal verComissao(
            @PathVariable Long id,
            @RequestParam String inicio,
            @RequestParam String fim
    ) {
        return service.calcularTotalComissaoMecanico(id, LocalDate.parse(inicio), LocalDate.parse(fim));
    }
}