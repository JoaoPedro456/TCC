package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.ItemServico;
import com.tcc.backend_TCC.service.ItemServicoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/servico")
public class ServicoController {

    @Autowired
    private ItemServicoService service;

    @GetMapping
    public org.springframework.data.domain.Page<ItemServico> listar(
            @RequestParam(required = false) String busca,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return service.listarTodos(busca, pageable);
    }

    @GetMapping("/todos-sem-paginacao")
    public List<ItemServico> listarTodosSemPaginacao() {
        return service.listarTodos();
    }

    @PostMapping
    public ResponseEntity<ItemServico> criar(@Valid @RequestBody ItemServico s) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.salvar(s));
    }

    @PutMapping("/{id}")
    public ItemServico atualizar(@PathVariable Long id, @Valid @RequestBody ItemServico s) {
        return service.atualizar(id, s);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}