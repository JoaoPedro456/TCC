package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.Material;
import com.tcc.backend_TCC.model.MaterialDTO;
import com.tcc.backend_TCC.service.MaterialService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/materiais")
@Validated
public class MaterialController {

    @Autowired
    private MaterialService service;

    @PostMapping
    public ResponseEntity<Material> criar(@Valid @RequestBody MaterialDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.salvar(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Material> atualizar(
            @PathVariable @Min(value = 1, message = "ID inválido") Long id,
            @Valid @RequestBody MaterialDTO dto) {
        return ResponseEntity.ok(service.atualizar(id, dto));
    }

    @GetMapping
    public Page<Material> listar(
            @RequestParam(required = false) String busca,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.pesquisar(busca, pageable);
    }

    @GetMapping("/{id}")
    public Material buscar(@PathVariable @Min(value = 1, message = "ID inválido") Long id) {
        return service.buscarPorId(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable @Min(value = 1, message = "ID inválido") Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
