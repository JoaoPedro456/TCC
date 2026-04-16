package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.enuns.StatusOS;
import com.tcc.backend_TCC.exception.RecursoNaoEncontradoException;
import com.tcc.backend_TCC.model.*;
import com.tcc.backend_TCC.repository.ItemServicoRepository;
import com.tcc.backend_TCC.repository.LancamentoRepository;
import com.tcc.backend_TCC.repository.OrdemServicoMecanicoRepository;
import com.tcc.backend_TCC.repository.OrdemServicoRepository;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrdemServicoServiceTest {

    @Mock
    private OrdemServicoRepository osRepository;

    @Mock
    private PessoaRepository pessoaRepository;

    @Mock
    private ItemServicoRepository itemServicoRepository;

    @Mock
    private LancamentoRepository lancamentoRepository;

    @Mock
    private OrdemServicoMecanicoRepository mecanicoRepository;

    @InjectMocks
    private OrdemServicoService service;

    @Test
    void salvar_comSucesso_retornaOS() {
        Pessoa cliente = new Pessoa();
        cliente.setId(1L);
        cliente.setNome("João");

        OrdemServicoDTO dto = new OrdemServicoDTO();
        OrdemServicoDTO.ClienteDTO clienteDto = new OrdemServicoDTO.ClienteDTO();
        clienteDto.setId(1L);
        dto.setCliente(clienteDto);
        dto.setObservacao("Troca de óleo");
        dto.setVeiculo("Gol 2020");
        dto.setQuilometragem(50000.0);
        dto.setValorKm(BigDecimal.valueOf(2.5));
        dto.setValorTotal(BigDecimal.valueOf(350.0));

        when(pessoaRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(osRepository.save(any(OrdemServico.class))).thenAnswer(i -> {
            OrdemServico saved = i.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        OrdemServico resultado = service.salvar(dto);

        assertEquals(StatusOS.ABERTA, resultado.getStatus());
        assertEquals(BigDecimal.valueOf(2.5), resultado.getValorKm());
        assertEquals("João", resultado.getCliente().getNome());
        verify(osRepository).save(any(OrdemServico.class));
    }

    @Test
    void salvar_clienteNaoEncontrado_lancaExcecao() {
        OrdemServicoDTO dto = new OrdemServicoDTO();
        OrdemServicoDTO.ClienteDTO clienteDto = new OrdemServicoDTO.ClienteDTO();
        clienteDto.setId(999L);
        dto.setCliente(clienteDto);
        dto.setValorTotal(BigDecimal.valueOf(100.0));

        when(pessoaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () -> service.salvar(dto));
    }

    @Test
    void salvar_comMecanicos_calculaComissao() {
        Pessoa cliente = new Pessoa();
        cliente.setId(1L);

        Pessoa mecanico = new Pessoa();
        mecanico.setId(2L);
        mecanico.setNome("Carlos");
        mecanico.setPercentualComissao(10.0); // 10%

        OrdemServicoDTO dto = new OrdemServicoDTO();
        OrdemServicoDTO.ClienteDTO clienteDto = new OrdemServicoDTO.ClienteDTO();
        clienteDto.setId(1L);
        dto.setCliente(clienteDto);
        dto.setValorTotal(BigDecimal.valueOf(200.0));
        dto.setValorKm(BigDecimal.ZERO);
        dto.setQuilometragem(0.0);

        OrdemServicoDTO.MecanicoDTO mDto = new OrdemServicoDTO.MecanicoDTO();
        OrdemServicoDTO.ClienteDTO mecanicoRef = new OrdemServicoDTO.ClienteDTO();
        mecanicoRef.setId(2L);
        mDto.setMecanico(mecanicoRef);
        dto.setMecanicos(List.of(mDto));

        when(pessoaRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(pessoaRepository.findById(2L)).thenReturn(Optional.of(mecanico));
        when(osRepository.save(any(OrdemServico.class))).thenAnswer(i -> {
            OrdemServico saved = i.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        OrdemServico resultado = service.salvar(dto);

        assertNotNull(resultado.getMecanicos());
        assertEquals(1, resultado.getMecanicos().size());
        assertEquals("Carlos", resultado.getMecanicos().get(0).getMecanico().getNome());
        // 10% de 200 = 20
        assertEquals(BigDecimal.valueOf(20.0), resultado.getMecanicos().get(0).getValorAtribuido());
    }

    @Test
    void atualizarStatus_paraConcluida_geraLancamento() {
        Pessoa cliente = new Pessoa();
        cliente.setId(1L);
        cliente.setNome("João");

        OrdemServico os = new OrdemServico();
        os.setId(1L);
        os.setCliente(cliente);
        os.setValorTotal(BigDecimal.valueOf(350.0));
        os.setStatus(StatusOS.ABERTA);

        when(osRepository.findById(1L)).thenReturn(Optional.of(os));
        when(osRepository.save(any(OrdemServico.class))).thenAnswer(i -> i.getArgument(0));

        service.atualizarStatus(1L, "CONCLUIDA");

        verify(lancamentoRepository).save(argThat(l ->
                l.getTipo() == com.tcc.backend_TCC.enuns.TipoLancamento.RECEBER &&
                l.getStatus() == com.tcc.backend_TCC.enuns.StatusLancamento.PENDENTE
        ));
    }

    @Test
    void buscarPorId_osNaoEncontrada_lancaExcecao() {
        when(osRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () -> service.buscarPorId(999L));
    }

    @Test
    void excluir_comSucesso_removeOS() {
        service.excluir(1L);

        verify(osRepository).deleteById(1L);
    }

    @Test
    void listarTodas_retornaLista() {
        OrdemServico os1 = new OrdemServico();
        os1.setId(1L);
        OrdemServico os2 = new OrdemServico();
        os2.setId(2L);

        when(osRepository.findAll()).thenReturn(List.of(os1, os2));

        List<OrdemServico> resultado = service.listarTodas();

        assertEquals(2, resultado.size());
    }
}
