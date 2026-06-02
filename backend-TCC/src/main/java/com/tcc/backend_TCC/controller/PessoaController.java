package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.enuns.TipoPessoa;
import com.tcc.backend_TCC.service.PessoaService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/pessoa")
public class PessoaController {

    private static final Logger log = LoggerFactory.getLogger(PessoaController.class);

    @Autowired
    private PessoaService service;

    @GetMapping
    public org.springframework.data.domain.Page<Pessoa> listar(
            @RequestParam(required = false) String busca,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return service.listarTodas(busca, pageable);
    }

    @GetMapping("/clientes")
    public org.springframework.data.domain.Page<Pessoa> listarClientes(
            @RequestParam(required = false) String busca,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return service.listarPorTipo(TipoPessoa.CLIENTE, busca, pageable);
    }

    @GetMapping("/funcionarios")
    public org.springframework.data.domain.Page<Pessoa> listarFuncionarios(
            @RequestParam(required = false) String busca,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return service.listarPorTipo(TipoPessoa.FUNCIONARIO, busca, pageable);
    }

    @GetMapping("/todos-sem-paginacao")
    public List<Pessoa> listarTodosSemPaginacao() {
        return service.listarTodas();
    }

    @PostMapping
    public ResponseEntity<Pessoa> criar(@Valid @RequestBody Pessoa p) {
        log.info("Recebida requisicao para criar pessoa: {}", p.getNome());
        Pessoa salva = service.salvar(p);
        log.info("Pessoa salva com sucesso! ID: {}", salva.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @PutMapping("/{id}")
    public Pessoa atualizar(@PathVariable Long id, @Valid @RequestBody Pessoa p) {
        return service.atualizar(id, p);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
