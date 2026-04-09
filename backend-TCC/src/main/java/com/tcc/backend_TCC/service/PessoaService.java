package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.model.TipoPessoa;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

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

    public Pessoa salvar(Pessoa p) {
        validarDuplicidades(p);
        return repository.save(p);
    }

    public Pessoa atualizar(Long id, Pessoa pAtualizada) {
        Pessoa pExistente = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pessoa não encontrada"));

        // Garante que o ID da pessoa que estamos a validar é o correto
        pAtualizada.setId(id);
        validarDuplicidades(pAtualizada);

        // Atualiza os dados
        pExistente.setNome(pAtualizada.getNome());
        pExistente.setCpf(pAtualizada.getCpf());
        pExistente.setTelefone(pAtualizada.getTelefone());
        pExistente.setEndereco(pAtualizada.getEndereco());
        pExistente.setTipo(pAtualizada.getTipo());
        pExistente.setCargo(pAtualizada.getCargo());
        pExistente.setSalarioBase(pAtualizada.getSalarioBase());
        pExistente.setPercentualComissao(pAtualizada.getPercentualComissao());

        return repository.save(pExistente);
    }

    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pessoa não encontrada");
        }
        repository.deleteById(id);
    }

    // ==========================================
    // MÉTODO DE VALIDAÇÃO DE DUPLICIDADE
    // ==========================================
    private void validarDuplicidades(Pessoa pessoa) {

        // 1. Validar CPF
        if (pessoa.getCpf() != null && !pessoa.getCpf().trim().isEmpty()) {
            Optional<Pessoa> pessoaExistente = repository.findByCpf(pessoa.getCpf());

            // Se o CPF já existir e NÃO for da própria pessoa que estamos a editar
            if (pessoaExistente.isPresent() && !pessoaExistente.get().getId().equals(pessoa.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este CPF já está cadastrado no sistema!");
            }
        }

        // 2. Validar Telefone
        if (pessoa.getTelefone() != null && !pessoa.getTelefone().trim().isEmpty()) {
            Optional<Pessoa> pessoaExistente = repository.findByTelefone(pessoa.getTelefone());

            if (pessoaExistente.isPresent() && !pessoaExistente.get().getId().equals(pessoa.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este Telefone já está cadastrado no sistema!");
            }
        }
    }
}