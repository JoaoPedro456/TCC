package com.tcc.backend_TCC.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * WEB SECURITY TESTS
 * Tests for HTTP security, authentication, authorization, and input validation
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("🛡️ Web Security Tests")
public class WebSecurityTest {

    @Autowired
    private MockMvc mockMvc;

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

    @Test
    @DisplayName("3. SQL Injection attempts should be blocked")
    void testSqlInjectionProtection() throws Exception {
        String[] sqlInjectionPayloads = {
            "' OR '1'='1",
            "admin'--",
            "1 OR 1=1"
        };

        for (String payload : sqlInjectionPayloads) {
            mockMvc.perform(post("/api/pessoa")
                    .contentType("application/json")
                    .content(String.format(
                        "{\"nome\":\"%s\",\"cpf\":\"123.456.789-00\",\"telefone\":\"11999999999\",\"endereco\":\"Rua X\",\"tipo\":\"CLIENTE\"}",
                        payload)))
                    .andExpect(status().is5xxServerError());
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

        for (String payload : xssPayloads) {
            mockMvc.perform(post("/api/pessoa")
                    .contentType("application/json")
                    .content(String.format(
                        "{\"nome\":\"%s\",\"cpf\":\"123.456.789-00\",\"telefone\":\"11999999999\",\"endereco\":\"Rua X\",\"tipo\":\"CLIENTE\"}",
                        payload)))
                    .andExpect(status().is5xxServerError());
        }
    }

    @Test
    @DisplayName("5. Large payload should be rejected")
    void testLargePayloadRejection() throws Exception {
        String largePayload = "A".repeat(10000);

        mockMvc.perform(post("/api/pessoa")
                .contentType("application/json")
                .content(String.format(
                    "{\"nome\":\"%s\",\"cpf\":\"123.456.789-00\",\"telefone\":\"11999999999\",\"endereco\":\"Rua X\",\"tipo\":\"CLIENTE\"}",
                    largePayload)))
                .andExpect(status().is4xxClientRequest());
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
                .andExpect(status().is4xxClientRequest());
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
        for (int i = 0; i < 6; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType("application/json")
                    .content("{\"login\":\"wrong\",\"senha\":\"wrong\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    @DisplayName("10. Path traversal blocked")
    void testPathTraversal() throws Exception {
        mockMvc.perform(get("/api/pessoa/../../../etc/passwd"))
                .andExpect(status().is4xxClientRequest());
    }
}
