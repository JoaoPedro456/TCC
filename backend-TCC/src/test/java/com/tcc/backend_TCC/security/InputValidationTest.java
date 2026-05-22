package com.tcc.backend_TCC.security;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.enuns.TipoPessoa;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@DisplayName("🛡️ Input Validation Tests")
public class InputValidationTest {

    @Autowired
    private PessoaRepository pessoaRepository;

    @Test
    @DisplayName("1. Pessoa creation with all new fields")
    void testValidPessoaWithAllFields() {
        Pessoa pessoa = new Pessoa();
        pessoa.setNome("João Silva");
        pessoa.setCpf("123.456.789-01");
        pessoa.setTelefone("(11) 99999-9901");
        pessoa.setLogradouro("Rua Teste, 123");
        pessoa.setBairro("Centro");
        pessoa.setNumero("456");
        pessoa.setCidade("São Paulo");
        pessoa.setTipo(TipoPessoa.CLIENTE);

        Pessoa saved = pessoaRepository.save(pessoa);
        assertNotNull(saved.getId());
        assertEquals("Centro", saved.getBairro());
        assertEquals("456", saved.getNumero());
        assertEquals("São Paulo", saved.getCidade());
    }

    @Test
    @DisplayName("2. Funcionario with all fields")
    void testValidFuncionarioWithCNPJ() {
        Pessoa pessoa = new Pessoa();
        pessoa.setNome("Funcionário Teste");
        pessoa.setCpf("987.654.321-00");
        pessoa.setCnpj("12.345.678/0001-90");
        pessoa.setTelefone("(21) 98888-8888");
        pessoa.setLogradouro("Rua C, 3");
        pessoa.setBairro("Industrial");
        pessoa.setNumero("100");
        pessoa.setCidade("Rio de Janeiro");
        pessoa.setTipo(TipoPessoa.FUNCIONARIO);
        pessoa.setCargo("Mecânico");
        pessoa.setSalarioBase(2500.00);
        pessoa.setPercentualComissao(10.0);

        Pessoa saved = pessoaRepository.save(pessoa);
        assertEquals(TipoPessoa.FUNCIONARIO, saved.getTipo());
        assertEquals("12.345.678/0001-90", saved.getCnpj());
        assertEquals("Industrial", saved.getBairro());
        assertEquals("100", saved.getNumero());
        assertEquals("Rio de Janeiro", saved.getCidade());
        assertEquals(2500.00, saved.getSalarioBase(), 0.01);
    }

    @Test
    @DisplayName("3. Cliente with CNPJ allowed")
    void testClienteWithCNPJ() {
        Pessoa pessoa = new Pessoa();
        pessoa.setNome("Empresa LTDA");
        pessoa.setCnpj("11.222.333/0001-81");
        pessoa.setTelefone("(11) 99999-9999");
        pessoa.setLogradouro("Rua A");
        pessoa.setBairro("Centro");
        pessoa.setNumero("10");
        pessoa.setCidade("São Paulo");
        pessoa.setTipo(TipoPessoa.CLIENTE);

        Pessoa saved = pessoaRepository.save(pessoa);
        assertEquals(TipoPessoa.CLIENTE, saved.getTipo());
        assertEquals("11.222.333/0001-81", saved.getCnpj());
    }

    @Test
    @DisplayName("4. CPF uniqueness enforced")
    void testCpfUniqueness() {
        String cpf = "123.456.789-04";

        Pessoa pessoa1 = new Pessoa();
        pessoa1.setNome("Pessoa 1");
        pessoa1.setCpf(cpf);
        pessoa1.setTelefone("(11) 99999-9904");
        pessoa1.setLogradouro("Rua A");
        pessoa1.setBairro("Centro");
        pessoa1.setNumero("1");
        pessoa1.setCidade("São Paulo");
        pessoa1.setTipo(TipoPessoa.CLIENTE);
        pessoaRepository.saveAndFlush(pessoa1);

        Pessoa pessoa2 = new Pessoa();
        pessoa2.setNome("Pessoa 2");
        pessoa2.setCpf(cpf);
        pessoa2.setTelefone("(21) 88888-8804");
        pessoa2.setLogradouro("Rua B");
        pessoa2.setBairro("Norte");
        pessoa2.setNumero("2");
        pessoa2.setCidade("Rio de Janeiro");
        pessoa2.setTipo(TipoPessoa.CLIENTE);

        assertThrows(Exception.class, () -> {
            pessoaRepository.saveAndFlush(pessoa2);
        });
    }

    @Test
    @DisplayName("5. CNPJ uniqueness enforced")
    void testCnpjUniqueness() {
        String cnpj = "12.345.678/0001-90";

        Pessoa pessoa1 = new Pessoa();
        pessoa1.setNome("Empresa 1");
        pessoa1.setCnpj(cnpj);
        pessoa1.setTelefone("(11) 99999-9999");
        pessoa1.setLogradouro("Rua A");
        pessoa1.setBairro("Centro");
        pessoa1.setNumero("10");
        pessoa1.setCidade("São Paulo");
        pessoa1.setTipo(TipoPessoa.FUNCIONARIO);
        pessoaRepository.saveAndFlush(pessoa1);

        Pessoa pessoa2 = new Pessoa();
        pessoa2.setNome("Empresa 2");
        pessoa2.setCnpj(cnpj);
        pessoa2.setTelefone("(21) 88888-8888");
        pessoa2.setLogradouro("Rua B");
        pessoa2.setBairro("Industrial");
        pessoa2.setNumero("20");
        pessoa2.setCidade("Rio de Janeiro");
        pessoa2.setTipo(TipoPessoa.FUNCIONARIO);

        assertThrows(Exception.class, () -> {
            pessoaRepository.saveAndFlush(pessoa2);
        });
    }
}
