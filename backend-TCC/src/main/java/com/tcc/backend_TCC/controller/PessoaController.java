package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.model.TipoPessoa;
import com.tcc.backend_TCC.service.PessoaService;
import org.springframework.beans.factory.annotation.Autowired;
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
    public Pessoa criar(@RequestBody Pessoa p) {
        return service.salvar(p);
    }

    @PutMapping("/{id}")
    public Pessoa atualizar(@PathVariable Long id, @RequestBody Pessoa p) {
        return service.atualizar(id, p);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}