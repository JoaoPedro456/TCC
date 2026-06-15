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

    public org.springframework.data.domain.Page<Pessoa> listarTodas(String busca, org.springframework.data.domain.Pageable pageable) {
        if (busca != null && !busca.trim().isEmpty()) {
            return repository.pesquisarPorNome(busca, pageable);
        }
        return repository.findByAtivoTrue(pageable);
    }

    public org.springframework.data.domain.Page<Pessoa> listarPorTipo(TipoPessoa tipo, String busca, org.springframework.data.domain.Pageable pageable) {
        if (busca != null && !busca.trim().isEmpty()) {
            return repository.pesquisarPorNomeETipo(busca, tipo, pageable);
        }
        return repository.findByTipoAndAtivoTrue(tipo, pageable);
    }

    public List<Pessoa> listarTodas() {
        return repository.findByAtivoTrue();
    }

    public List<Pessoa> listarPorTipo(TipoPessoa tipo) {
        return repository.findByTipoAndAtivoTrue(tipo);
    }

    public Pessoa buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pessoa nao encontrada"));
    }

    public Pessoa salvar(Pessoa p) {
        // Se for CPF, verifica se existe registro inativo e reativa/atualiza
        if (p.getCpf() != null && !p.getCpf().trim().isEmpty()) {
            if (!isValidCPF(p.getCpf())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF inválido!");
            }
            Optional<Pessoa> inativo = repository.findByCpfIncludingDeleted(p.getCpf());
            if (inativo.isPresent()) {
                Pessoa existente = inativo.get();
                if (existente.getAtivo() != null && !existente.getAtivo()) {
                    atualizarDadosExistentes(existente, p);
                    existente.setAtivo(true);
                    return repository.save(existente);
                }
            }
        }

        // Se for CNPJ, verifica se existe registro inativo e reativa/atualiza
        if (p.getCnpj() != null && !p.getCnpj().trim().isEmpty()) {
            if (!isValidCNPJ(p.getCnpj())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CNPJ inválido!");
            }
            Optional<Pessoa> inativo = repository.findByCnpjIncludingDeleted(p.getCnpj());
            if (inativo.isPresent()) {
                Pessoa existente = inativo.get();
                if (existente.getAtivo() != null && !existente.getAtivo()) {
                    atualizarDadosExistentes(existente, p);
                    existente.setAtivo(true);
                    return repository.save(existente);
                }
            }
        }

        validarDuplicidades(p);
        return repository.save(p);
    }

    public Pessoa atualizar(Long id, Pessoa pAtualizada) {
        Pessoa pExistente = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pessoa nao encontrada"));

        pAtualizada.setId(id);
        validarDuplicidades(pAtualizada);

        atualizarDadosExistentes(pExistente, pAtualizada);

        return repository.save(pExistente);
    }

    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pessoa nao encontrada");
        }
        repository.deleteById(id);
    }

    private void atualizarDadosExistentes(Pessoa existente, Pessoa novo) {
        existente.setNome(novo.getNome());
        existente.setCpf(novo.getCpf());
        existente.setCnpj(novo.getCnpj());
        existente.setTelefone(novo.getTelefone());
        existente.setCep(novo.getCep());
        existente.setLogradouro(novo.getLogradouro());
        existente.setBairro(novo.getBairro());
        existente.setNumero(novo.getNumero());
        existente.setComplemento(novo.getComplemento());
        existente.setCidade(novo.getCidade());
        existente.setEstado(novo.getEstado());
        existente.setTipo(novo.getTipo());
        existente.setCargo(novo.getCargo());
        existente.setSalarioBase(novo.getSalarioBase());
        existente.setPercentualComissao(novo.getPercentualComissao());
    }

    private void validarDuplicidades(Pessoa pessoa) {
        if (pessoa.getCpf() != null && !pessoa.getCpf().trim().isEmpty()) {
            if (!isValidCPF(pessoa.getCpf())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF inválido!");
            }
            Optional<Pessoa> pessoaExistente = repository.findByCpfAndAtivoTrue(pessoa.getCpf());
            if (pessoaExistente.isPresent() && !pessoaExistente.get().getId().equals(pessoa.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este CPF já está cadastrado no sistema!");
            }
        }

        if (pessoa.getCnpj() != null && !pessoa.getCnpj().trim().isEmpty()) {
            if (!isValidCNPJ(pessoa.getCnpj())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CNPJ inválido!");
            }
            Optional<Pessoa> pessoaExistente = repository.findByCnpjAndAtivoTrue(pessoa.getCnpj());
            if (pessoaExistente.isPresent() && !pessoaExistente.get().getId().equals(pessoa.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este CNPJ já está cadastrado no sistema!");
            }
        }

        if (pessoa.getTelefone() != null && !pessoa.getTelefone().trim().isEmpty()) {
            Optional<Pessoa> pessoaExistente = repository.findByTelefoneAndAtivoTrue(pessoa.getTelefone());
            if (pessoaExistente.isPresent() && !pessoaExistente.get().getId().equals(pessoa.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este Telefone já está cadastrado no sistema!");
            }
        }
    }

    public static boolean isValidCPF(String cpf) {
        if (cpf == null) return false;
        String cleanCpf = cpf.replaceAll("\\D", "");
        if (cleanCpf.length() != 11) return false;
        if (cleanCpf.matches("(\\d)\\1{10}")) return false;

        try {
            int soma = 0;
            for (int i = 0; i < 9; i++) {
                soma += Character.getNumericValue(cleanCpf.charAt(i)) * (10 - i);
            }
            int r1 = 11 - (soma % 11);
            int digito1 = (r1 == 10 || r1 == 11) ? 0 : r1;

            soma = 0;
            for (int i = 0; i < 10; i++) {
                soma += Character.getNumericValue(cleanCpf.charAt(i)) * (11 - i);
            }
            int r2 = 11 - (soma % 11);
            int digito2 = (r2 == 10 || r2 == 11) ? 0 : r2;

            return digito1 == Character.getNumericValue(cleanCpf.charAt(9)) &&
                   digito2 == Character.getNumericValue(cleanCpf.charAt(10));
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean isValidCNPJ(String cnpj) {
        if (cnpj == null) return false;
        String cleanCnpj = cnpj.replaceAll("\\D", "");
        if (cleanCnpj.length() != 14) return false;
        if (cleanCnpj.matches("(\\d)\\1{13}")) return false;

        try {
            int[] pesoCNPJ = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
            
            int soma = 0;
            for (int i = 0; i < 12; i++) {
                soma += Character.getNumericValue(cleanCnpj.charAt(i)) * pesoCNPJ[i + 1];
            }
            int r1 = soma % 11;
            int digito1 = (r1 < 2) ? 0 : 11 - r1;

            soma = 0;
            for (int i = 0; i < 13; i++) {
                soma += Character.getNumericValue(cleanCnpj.charAt(i)) * pesoCNPJ[i];
            }
            int r2 = soma % 11;
            int digito2 = (r2 < 2) ? 0 : 11 - r2;

            return digito1 == Character.getNumericValue(cleanCnpj.charAt(12)) &&
                   digito2 == Character.getNumericValue(cleanCnpj.charAt(13));
        } catch (Exception e) {
            return false;
        }
    }
}
