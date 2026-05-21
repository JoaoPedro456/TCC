package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.model.TipoPessoa;
import com.tcc.backend_TCC.service.PessoaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/pessoa")
public class PessoaController {

    @Autowired
    private PessoaService service;

    @GetMapping
    public List<Pessoa> listar() {
        return service.listarTodas();
    }

    @GetMapping("/clientes")
    public List<Pessoa> listarClientes() {
        return service.listarPorTipo(TipoPessoa.CLIENTE);
    }

    @GetMapping("/funcionarios")
    public List<Pessoa> listarFuncionarios() {
        return service.listarPorTipo(TipoPessoa.FUNCIONARIO);
    }

    @PostMapping
    public ResponseEntity<Pessoa> criar(@Valid @RequestBody Pessoa p) {
        System.out.println("[PessoaController] RECEBEU REQUISICAO POST! Dados: " + p);
        try {
            Pessoa salva = service.salvar(p);
            System.out.println("[PessoaController] PESSOA SALVA COM SUCESSO! ID: " + salva.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(salva);
        } catch (Exception e) {
            System.err.println("[PessoaController] ERRO AO SALVAR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
