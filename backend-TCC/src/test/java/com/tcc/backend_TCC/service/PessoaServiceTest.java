package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.enuns.TipoPessoa;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PessoaServiceTest {

    @Mock
    private PessoaRepository repository;

    @InjectMocks
    private PessoaService service;

    @Test
    void salvar_comSucesso_retornaPessoa() {
        Pessoa pessoa = new Pessoa();
        pessoa.setNome("João");
        pessoa.setTelefone("11999990000");
        pessoa.setTipo(TipoPessoa.CLIENTE);

        when(repository.save(any(Pessoa.class))).thenReturn(pessoa);

        Pessoa resultado = service.salvar(pessoa);

        assertEquals("João", resultado.getNome());
        verify(repository).save(pessoa);
    }

    @Test
    void salvar_cpfDuplicado_lancaExcecao() {
        Pessoa pessoa = new Pessoa();
        pessoa.setNome("João");
        pessoa.setCpf("12345678900");
        pessoa.setTipo(TipoPessoa.CLIENTE);

        Pessoa existente = new Pessoa();
        existente.setId(1L);
        existente.setCpf("12345678900");

        when(repository.findByCpfIncludingDeleted("12345678900")).thenReturn(Optional.of(existente));

        assertThrows(ResponseStatusException.class, () -> service.salvar(pessoa));
    }

    @Test
    void atualizar_comSucesso_retornaPessoaAtualizada() {
        Pessoa existente = new Pessoa();
        existente.setId(1L);
        existente.setNome("Antigo");

        Pessoa atualizada = new Pessoa();
        atualizada.setNome("Novo");
        atualizada.setTelefone("11999990000");
        atualizada.setTipo(TipoPessoa.CLIENTE);

        when(repository.findById(1L)).thenReturn(Optional.of(existente));
        when(repository.save(any(Pessoa.class))).thenReturn(atualizada);

        Pessoa resultado = service.atualizar(1L, atualizada);

        assertEquals("Novo", resultado.getNome());
    }

    @Test
    void atualizar_pessoaNaoEncontrada_lancaExcecao() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () ->
                service.atualizar(999L, new Pessoa()));
    }

    @Test
    void excluir_comSucesso_removePessoa() {
        when(repository.existsById(1L)).thenReturn(true);

        service.excluir(1L);

        verify(repository).deleteById(1L);
    }

    @Test
    void excluir_pessoaNaoEncontrada_lancaExcecao() {
        when(repository.existsById(999L)).thenReturn(false);

        assertThrows(ResponseStatusException.class, () -> service.excluir(999L));
    }
}
