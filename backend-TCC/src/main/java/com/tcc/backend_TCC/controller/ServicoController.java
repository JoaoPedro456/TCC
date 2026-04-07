package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.ItemServico;
import com.tcc.backend_TCC.service.ItemServicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servico")
@CrossOrigin(origins = "*")
public class ServicoController {

    @Autowired
    private ItemServicoService service;

    @GetMapping
    public List<ItemServico> listar() {
        return service.listarTodos();
    }

    @PostMapping
    public ItemServico criar(@RequestBody ItemServico s) {
        return service.salvar(s);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}