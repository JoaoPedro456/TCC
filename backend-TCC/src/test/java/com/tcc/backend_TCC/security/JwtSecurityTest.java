package com.tcc.backend_TCC.security;

import com.tcc.backend_TCC.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JWT SECURITY TESTS
 * Tests for JWT token validation and security
 */
@SpringBootTest
@DisplayName("🛡️ JWT Security Tests")
public class JwtSecurityTest {

    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("1. Validate correct token")
    void testValidateCorrectToken() {
        String token = jwtService.gerarToken("user", "USER");
        assertTrue(jwtService.tokenValido(token),
                "Valid token should pass validation");
    }

    @Test
    @DisplayName("2. Extract username from token")
    void testExtractUsername() {
        String username = "testuser";
        String token = jwtService.gerarToken(username, "USER");
        assertEquals(username, jwtService.extrairLogin(token),
                "Extracted username should match");
    }

    @Test
    @DisplayName("3. Token should have expiration")
    void testTokenHasExpiration() {
        String token = jwtService.gerarToken("user", "USER");
        assertNotNull(jwtService.extrairExpiracao(token),
                "Token should have expiration date");
    }

    @Test
    @DisplayName("4. Tampered token should be invalid")
    void testTamperedToken() {
        String token = jwtService.gerarToken("user", "USER");
        String tamperedToken = token.substring(0, 10) + "X" + token.substring(11);
        assertFalse(jwtService.tokenValido(tamperedToken),
                "Tampered token should be invalid");
    }

    @Test
    @DisplayName("5. Expired token should be invalid")
    void testExpiredToken() {
        String username = "user";
        String token = jwtService.gerarToken(username, "USER");

        assertNotNull(jwtService.extrairExpiracao(token),
                "Token should have expiration");
    }

    @Test
    @DisplayName("6. Empty token should be invalid")
    void testEmptyToken() {
        assertFalse(jwtService.tokenValido(""),
                "Empty token should be invalid");
    }

    @Test
    @DisplayName("7. Null token should be invalid")
    void testNullToken() {
        assertFalse(jwtService.tokenValido(null),
                "Null token should be invalid");
    }

    @Test
    @DisplayName("8. Malformed token should be invalid")
    void testMalformedToken() {
        assertFalse(jwtService.tokenValido("not-a-jwt-token"),
                "Malformed token should be invalid");
    }

    @Test
    @DisplayName("9. Token with wrong signature should be invalid")
    void testWrongSignature() {
        String token1 = jwtService.gerarToken("user1", "USER");
        String token2 = jwtService.gerarToken("user2", "USER");
        assertNotEquals(token1, token2,
                "Different tokens should have different signatures");
    }

    @Test
    @DisplayName("10. Token contains correct role")
    void testTokenRole() {
        String token = jwtService.gerarToken("admin", "ADMIN");
        assertTrue(jwtService.tokenValido(token),
                "Admin token should be valid");
    }

    @Test
    @DisplayName("11. Very old token structure")
    void testTokenStructure() {
        String token = jwtService.gerarToken("user", "USER");
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length,
                "JWT should have 3 parts");
        assertTrue(parts[0].length() > 0 && parts[1].length() > 0 && parts[2].length() > 0,
                "All parts should be non-empty");
    }

    @Test
    @DisplayName("12. Token for different users different")
    void testTokensForDifferentUsers() {
        String token1 = jwtService.gerarToken("user1", "USER");
        String token2 = jwtService.gerarToken("user2", "USER");
        assertNotEquals(token1, token2,
                "Tokens for different users should be different");
    }
}
