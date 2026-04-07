package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.model.TipoPessoa;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PessoaService {

    @Autowired
    private PessoaRepository repository;

    public List<Pessoa> listarTodas() {
        return repository.findAll();
    }

    public List<Pessoa> listarPorTipo(TipoPessoa tipo) {
        return repository.findByTipo(tipo);
    }

    public Pessoa salvar(Pessoa pessoa) {
        if (pessoa.getTipo() == TipoPessoa.FUNCIONARIO && pessoa.getPercentualComissao() == null) {
            pessoa.setPercentualComissao(0.0);
        }
        if (pessoa.getTipo() == TipoPessoa.FUNCIONARIO && pessoa.getSalarioBase() == null) {
            pessoa.setSalarioBase(0.0);
        }
        return repository.save(pessoa);
    }

    public Pessoa atualizar(Long id, Pessoa dados) {
        Pessoa pessoa = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pessoa não encontrada"));
        pessoa.setNome(dados.getNome());
        pessoa.setTelefone(dados.getTelefone());
        pessoa.setCpf(dados.getCpf());
        pessoa.setEndereco(dados.getEndereco());
        pessoa.setCargo(dados.getCargo());
        pessoa.setSalarioBase(dados.getSalarioBase());
        pessoa.setPercentualComissao(dados.getPercentualComissao());
        return repository.save(pessoa);
    }

    public void excluir(Long id) {
        repository.deleteById(id);
    }
}