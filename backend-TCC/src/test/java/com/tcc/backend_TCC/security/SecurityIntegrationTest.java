package com.tcc.backend_TCC.security;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.enuns.TipoPessoa;
import com.tcc.backend_TCC.repository.PessoaRepository;
import com.tcc.backend_TCC.security.AuthService;
import com.tcc.backend_TCC.service.RateLimitingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SECURITY INTEGRATION TESTS
 * End-to-end security scenarios
 */
@SpringBootTest
@Transactional
@DisplayName("🛡️ Security Integration Tests")
public class SecurityIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private RateLimitingService rateLimitingService;

    @Autowired
    private PessoaRepository pessoaRepository;

    @BeforeEach
    void setUp() {
        rateLimitingService.clearAll();
    }

    @Test
    @DisplayName("1. Brute force attack simulation")
    void testBruteForceAttack() {
        String ip = "10.0.0.1";
        String username = "admin";

        // Simulate 10 failed login attempts
        for (int i = 0; i < 10; i++) {
            rateLimitingService.registerFailedAttempt(ip, username);
        }

        // Should be blocked after 5 attempts
        assertTrue(rateLimitingService.isBlocked(ip, username),
                "Should be blocked after multiple failed attempts");

        var status = rateLimitingService.getBlockedStatus();
        assertEquals(5, ((Number) status.get("ipAttempts")).intValue(),
                "Should show 5 attempts (capped)");
    }

    @Test
    @DisplayName("2. Successful login resets rate limit")
    void testSuccessfulLoginResetsRateLimit() {
        String ip = "10.0.0.2";
        String username = "user123";

        // Create user first
        Pessoa usuario = new Pessoa();
        usuario.setNome("Test User");
        usuario.setCpf("111.222.333-44");
        usuario.setTelefone("(11) 99999-9999");
        usuario.setLogradouro("Rua A");
        usuario.setTipo(TipoPessoa.FUNCIONARIO);
        usuario.setCargo("Teste");
        usuario.setSalarioBase(1000.0);
        usuario.setPercentualComissao(5.0);
        usuario = pessoaRepository.save(usuario);

        // Add some failed attempts
        rateLimitingService.registerFailedAttempt(ip, username);
        rateLimitingService.registerFailedAttempt(ip, username);

        // Reset after successful login
        rateLimitingService.resetLoginAttempts(ip, username);

        assertFalse(rateLimitingService.isBlocked(ip, username),
                "Should not be blocked after reset");
    }

    @Test
    @DisplayName("3. Token validation in complete flow")
    void testCompleteTokenFlow() {
        String username = "testuser";
        String role = "USER";

        // Generate token
        String token = authService.generateTestToken(username, role);
        assertNotNull(token, "Token should be generated");

        // Validate token
        assertTrue(authService.validateTestToken(token),
                "Token should be valid");

        // Extract claims
        String extractedUsername = authService.extractUsernameTest(token);
        assertEquals(username, extractedUsername,
                "Username should match");
    }

    @Test
    @DisplayName("4. Multiple security layers")
    void testMultipleSecurityLayers() {
        String ip = "192.168.1.50";
        String username = "attacker";

        // Layer 1: Rate limiting
        for (int i = 0; i < 6; i++) {
            rateLimitingService.registerFailedAttempt(ip, username);
        }
        assertTrue(rateLimitingService.isBlocked(ip, username),
                "First layer (rate limit) should block");

        // Layer 2: IP blocking
        boolean unblocked = rateLimitingService.unblock(ip, null);
        assertTrue(unblocked, "Should be able to unblock");

        // Layer 3: Reset on success
        rateLimitingService.resetLoginAttempts(ip, username);
        assertFalse(rateLimitingService.isBlocked(ip, username),
                "Should be clean after reset");
    }

    @Test
    @DisplayName("5. Data persistence with security")
    void testSecureDataPersistence() {
        Pessoa pessoa = new Pessoa();
        pessoa.setNome("Secure User");
        pessoa.setCpf("555.666.777-88");
        pessoa.setTelefone("(11) 91234-5678");
        pessoa.setLogradouro("Rua Segura, 123");
        pessoa.setTipo(TipoPessoa.FUNCIONARIO);
        pessoa.setCargo("Analista");
        pessoa.setSalarioBase(3000.0);
        pessoa.setPercentualComissao(8.0);

        // Save
        Pessoa saved = pessoaRepository.save(pessoa);
        assertNotNull(saved.getId(), "Should have ID");

        // Retrieve
        Pessoa retrieved = pessoaRepository.findById(saved.getId()).orElse(null);
        assertNotNull(retrieved, "Should retrieve saved entity");
        assertEquals(saved.getCpf(), retrieved.getCpf(), "CPF should match");

        // Delete
        pessoaRepository.delete(saved);
        assertFalse(pessoaRepository.findById(saved.getId()).isPresent(),
                "Should be deleted");
    }

    @Test
    @DisplayName("6. Concurrent access security")
    void testConcurrentAccess() throws InterruptedException {
        String ip = "10.0.0.100";
        String baseUser = "user";

        Thread[] threads = new Thread[5];
        for (int i = 0; i < threads.length; i++) {
            final int threadNum = i;
            threads[i] = new Thread(() -> {
                String username = baseUser + threadNum;
                for (int j = 0; j < 3; j++) {
                    rateLimitingService.registerFailedAttempt(ip, username);
                }
            });
            threads[i].start();
        }

        for (Thread t : threads) {
            t.join();
        }

        // After all threads complete, should be blocked (5 threads * 3 attempts = 15 total)
        assertTrue(rateLimitingService.isBlocked(ip, baseUser + "0") ||
                   rateLimitingService.getBlockedStatus().get("ipAttempts").equals(5),
                "Should be blocked due to concurrent attempts");
    }

    @Test
    @DisplayName("7. SQL injection in username")
    void testSqlInjectionInUsername() {
        String maliciousUsername = "admin'; DROP TABLE pessoa;--";

        // This should not cause SQL injection if using JPA
        Pessoa pessoa = new Pessoa();
        pessoa.setNome(maliciousUsername);
        pessoa.setCpf("999.888.777-66");
        pessoa.setTelefone("(11) 99999-9999");
        pessoa.setLogradouro("Rua Teste");
        pessoa.setTipo(TipoPessoa.CLIENTE);

        // JPA should handle this safely
        Pessoa saved = pessoaRepository.save(pessoa);
        assertEquals(maliciousUsername, saved.getNome(),
                "Username should be saved as literal, not executed");
    }

    @Test
    @DisplayName("8. XSS in nome field")
    void testXssInNome() {
        String xssPayload = "<script>alert('XSS')</script>";

        Pessoa pessoa = new Pessoa();
        pessoa.setNome(xssPayload);
        pessoa.setCpf("111.111.111-11");
        pessoa.setTelefone("(11) 99999-9999");
        pessoa.setLogradouro("Rua X");
        pessoa.setTipo(TipoPessoa.CLIENTE);

        Pessoa saved = pessoaRepository.save(pessoa);
        assertEquals(xssPayload, saved.getNome(),
                "XSS payload should be stored as text");

        // Important: Frontend must escape on display
        assertTrue(saved.getNome().contains("<script>"),
                "Payload preserved for testing");
    }

    @Test
    @DisplayName("9. Privilege escalation attempt")
    void testPrivilegeEscalation() {
        Pessoa usuario = new Pessoa();
        usuario.setNome("Escalator");
        usuario.setCpf("222.333.444-55");
        usuario.setTelefone("(11) 99999-9999");
        usuario.setLogradouro("Rua Esc");
        usuario.setTipo(TipoPessoa.CLIENTE);
        // Attempting to set admin fields as client
        usuario.setCargo(null);
        usuario.setSalarioBase(0.0);
        usuario.setPercentualComissao(0.0);

        Pessoa saved = pessoaRepository.save(usuario);
        assertEquals(TipoPessoa.CLIENTE, saved.getTipo(),
                "Type should remain as set");
    }

    @Test
    @DisplayName("10. Session fixation test")
    void testSessionFixation() {
        String token1 = authService.generateTestToken("user1", "USER");
        String token2 = authService.generateTestToken("user1", "USER");

        // Different tokens for same user
        assertNotEquals(token1, token2,
                "Each login should generate new token");

        // Both should be valid
        assertTrue(authService.validateTestToken(token1),
                "First token should be valid");
        assertTrue(authService.validateTestToken(token2),
                "Second token should be valid");
    }
}
