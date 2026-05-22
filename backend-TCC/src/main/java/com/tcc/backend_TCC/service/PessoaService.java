package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.enuns.TipoPessoa;
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pessoa nao encontrada"));

        pAtualizada.setId(id);
        validarDuplicidades(pAtualizada);

        pExistente.setNome(pAtualizada.getNome());
        pExistente.setCpf(pAtualizada.getCpf());
        pExistente.setCnpj(pAtualizada.getCnpj());
        pExistente.setTelefone(pAtualizada.getTelefone());
        pExistente.setCep(pAtualizada.getCep());
        pExistente.setLogradouro(pAtualizada.getLogradouro());
        pExistente.setBairro(pAtualizada.getBairro());
        pExistente.setNumero(pAtualizada.getNumero());
        pExistente.setComplemento(pAtualizada.getComplemento());
        pExistente.setCidade(pAtualizada.getCidade());
        pExistente.setEstado(pAtualizada.getEstado());
        pExistente.setTipo(pAtualizada.getTipo());
        pExistente.setCargo(pAtualizada.getCargo());
        pExistente.setSalarioBase(pAtualizada.getSalarioBase());
        pExistente.setPercentualComissao(pAtualizada.getPercentualComissao());

        return repository.save(pExistente);
    }

    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pessoa nao encontrada");
        }
        repository.deleteById(id);
    }

    private void validarDuplicidades(Pessoa pessoa) {
        if (pessoa.getCpf() != null && !pessoa.getCpf().trim().isEmpty()) {
            Optional<Pessoa> pessoaExistente = repository.findByCpfIncludingDeleted(pessoa.getCpf());
            if (pessoaExistente.isPresent() && !pessoaExistente.get().getId().equals(pessoa.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este CPF já está cadastrado no sistema!");
            }
        }

        if (pessoa.getCnpj() != null && !pessoa.getCnpj().trim().isEmpty()) {
            Optional<Pessoa> pessoaExistente = repository.findByCnpjIncludingDeleted(pessoa.getCnpj());
            if (pessoaExistente.isPresent() && !pessoaExistente.get().getId().equals(pessoa.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este CNPJ já está cadastrado no sistema!");
            }
        }

        if (pessoa.getTelefone() != null && !pessoa.getTelefone().trim().isEmpty()) {
            Optional<Pessoa> pessoaExistente = repository.findByTelefoneIncludingDeleted(pessoa.getTelefone());
            if (pessoaExistente.isPresent() && !pessoaExistente.get().getId().equals(pessoa.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este Telefone já está cadastrado no sistema!");
            }
        }
    }
}
