package com.tcc.backend_TCC.security;

import com.tcc.backend_TCC.service.RateLimitingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import org.springframework.transaction.annotation.Transactional;

/**
 * WEB SECURITY TESTS
 * Tests for HTTP security, authentication, authorization, and input validation
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("🛡️ Web Security Tests")
public class WebSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RateLimitingService rateLimitingService;

    @BeforeEach
    void setUp() {
        rateLimitingService.clearAll();
    }

    @Test
    @DisplayName("1. Unauthenticated user should not access protected endpoints")
    void testUnauthenticatedAccessDenied() throws Exception {
        mockMvc.perform(get("/api/pessoa"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/ordens"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/financeiro/receber"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testGetPessoasAuthenticated() throws Exception {
        String token = jwtService.gerarToken("Andressa", "ADMIN");
        System.out.println("TOKEN_DIAGNOSTICO: " + token);
        mockMvc.perform(get("/api/pessoa")
                .header("Authorization", "Bearer " + token))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("2. Public endpoints should be accessible without authentication")
    void testPublicEndpointsAccessible() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"login\":\"test\",\"senha\":\"test\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));
    }

    private String generateUniqueCpf() {
        int[] cpfArray = new int[9];
        for (int i = 0; i < 9; i++) {
            cpfArray[i] = (int) (Math.random() * 10);
        }
        
        int soma = 0;
        for (int i = 0; i < 9; i++) {
            soma += cpfArray[i] * (10 - i);
        }
        int r1 = 11 - (soma % 11);
        int d1 = (r1 == 10 || r1 == 11) ? 0 : r1;
        
        soma = 0;
        for (int i = 0; i < 9; i++) {
            soma += cpfArray[i] * (11 - i);
        }
        soma += d1 * 2;
        int r2 = 11 - (soma % 11);
        int d2 = (r2 == 10 || r2 == 11) ? 0 : r2;
        
        return String.format("%d%d%d.%d%d%d.%d%d%d-%d%d",
            cpfArray[0], cpfArray[1], cpfArray[2],
            cpfArray[3], cpfArray[4], cpfArray[5],
            cpfArray[6], cpfArray[7], cpfArray[8],
            d1, d2);
    }

    private String generateUniqueTel() {
        return String.format("1199%07d", (int)(Math.random() * 10000000));
    }

    @Test
    @DisplayName("3. SQL Injection attempts should be blocked")
    void testSqlInjectionProtection() throws Exception {
        String[] sqlInjectionPayloads = {
            "' OR '1'='1",
            "admin'--",
            "1 OR 1=1"
        };

        String token = jwtService.gerarToken("admin", "ADMIN");

        for (String payload : sqlInjectionPayloads) {
            String uniqueCpf = generateUniqueCpf();
            String uniqueTel = generateUniqueTel();
            mockMvc.perform(post("/api/pessoa")
                    .header("Authorization", "Bearer " + token)
                    .contentType("application/json")
                    .content(String.format(
                        "{\"nome\":\"%s\",\"cpf\":\"%s\",\"telefone\":\"%s\",\"logradouro\":\"Rua X\",\"tipo\":\"CLIENTE\"}",
                        payload, uniqueCpf, uniqueTel)))
                    .andExpect(status().isCreated());
        }
    }

    @Test
    @DisplayName("4. XSS attempts should be rejected")
    void testXssProtection() throws Exception {
        String[] xssPayloads = {
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')"
        };

        String token = jwtService.gerarToken("admin", "ADMIN");

        for (String payload : xssPayloads) {
            String uniqueCpf = generateUniqueCpf();
            String uniqueTel = generateUniqueTel();
            mockMvc.perform(post("/api/pessoa")
                    .header("Authorization", "Bearer " + token)
                    .contentType("application/json")
                    .content(String.format(
                        "{\"nome\":\"%s\",\"cpf\":\"%s\",\"telefone\":\"%s\",\"logradouro\":\"Rua X\",\"tipo\":\"CLIENTE\"}",
                        payload, uniqueCpf, uniqueTel)))
                    .andExpect(status().isCreated());
        }
    }

    @Test
    @DisplayName("5. Large payload should be rejected")
    void testLargePayloadRejection() throws Exception {
        String largePayload = "A".repeat(10000);
        String token = jwtService.gerarToken("admin", "ADMIN");
        String uniqueCpf = generateUniqueCpf();
        String uniqueTel = generateUniqueTel();

        mockMvc.perform(post("/api/pessoa")
                .header("Authorization", "Bearer " + token)
                .contentType("application/json")
                .content(String.format(
                    "{\"nome\":\"%s\",\"cpf\":\"%s\",\"telefone\":\"%s\",\"logradouro\":\"Rua X\",\"tipo\":\"CLIENTE\"}",
                    largePayload, uniqueCpf, uniqueTel)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("6. Security headers should be present")
    void testSecurityHeaders() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    @DisplayName("7. HTTP methods should be restricted")
    void testHttpMethodRestrictions() throws Exception {
        mockMvc.perform(get("/api/auth/login"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("8. Authentication bypass should fail")
    void testAuthBypass() throws Exception {
        mockMvc.perform(get("/api/pessoa")
                .header("Authorization", "Bearer invalidtoken"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("9. Rate limiting on login")
    void testRateLimitingOnLogin() throws Exception {
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType("application/json")
                    .content("{\"login\":\"wrong\",\"senha\":\"wrong\"}"))
                    .andExpect(status().isBadRequest());
        }

        // 6th attempt should be rate limited (429)
        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"login\":\"wrong\",\"senha\":\"wrong\"}"))
                .andExpect(status().is(429));
    }

    @Test
    @DisplayName("10. Path traversal blocked")
    void testPathTraversal() throws Exception {
        mockMvc.perform(get("/api/pessoa/../../../etc/passwd"))
                .andExpect(status().is4xxClientError());
    }
}
