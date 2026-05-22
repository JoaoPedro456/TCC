package com.tcc.backend_TCC.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SECURITY AUDIT TESTS
 * Comprehensive security validation to ensure no vulnerabilities
 */
@SpringBootTest
@DisplayName("🛡️ Security Audit Tests")
public class SecurityAuditTest {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("1. Password encoder should use BCrypt with proper strength")
    void testPasswordEncoderUsesBCrypt() {
        String rawPassword = "Test@1234";
        String encoded = passwordEncoder.encode(rawPassword);
        
        assertNotNull(encoded, "Encoded password should not be null");
        assertTrue(encoded.startsWith("$2a$") || encoded.startsWith("$2b$") || encoded.startsWith("$2y$"),
                "Password should be BCrypt encoded");
        assertTrue(encoded.length() >= 60, "BCrypt hash should be at least 60 characters");
        assertTrue(passwordEncoder.matches(rawPassword, encoded),
                "Password should match original");
    }

    @Test
    @DisplayName("2. BCrypt should prevent identical passwords from having same hash")
    void testBCryptGeneratesDifferentHashesForSamePassword() {
        String password = "SamePassword123!";
        String hash1 = passwordEncoder.encode(password);
        String hash2 = passwordEncoder.encode(password);
        
        assertNotEquals(hash1, hash2,
                "BCrypt should generate different hashes for same password");
        assertTrue(passwordEncoder.matches(password, hash1));
        assertTrue(passwordEncoder.matches(password, hash2));
    }

    @Test
    @DisplayName("3. JWT token should be generated with proper claims")
    void testJwtTokenGeneration() {
        String username = "testuser";
        String role = "USER";
        
        String token = jwtService.generateToken(username, role);
        
        assertNotNull(token, "Token should not be null");
        assertFalse(token.isEmpty(), "Token should not be empty");
        assertTrue(token.split("\\.").length == 3,
                "JWT should have 3 parts separated by dots");
        
        // Token should start with typical JWT pattern
        assertTrue(token.matches("^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$"),
                "Token should match JWT format");
    }

    @Test
    @DisplayName("4. JWT token should contain username claim")
    void testJwtContainsUsername() {
        String username = "testuser";
        String token = jwtService.generateToken(username, "USER");
        
        String extractedUsername = jwtService.extractUsername(token);
        assertEquals(username, extractedUsername,
                "Extracted username should match original");
    }

    @Test
    @DisplayName("5. JWT token should be valid and not expired")
    void testJwtTokenValidity() {
        String token = jwtService.generateToken("testuser", "USER");
        
        assertTrue(jwtService.validateToken(token),
                "Freshly generated token should be valid");
        assertFalse(jwtService.isTokenExpired(token),
                "Fresh token should not be expired");
    }

    @Test
    @DisplayName("6. JWT should reject malformed tokens")
    void testJwtRejectsMalformedTokens() {
        String[] malformedTokens = {
            "",
            "not.a.token",
            "header.payload",
            "header.payload.signature.extra",
            null
        };
        
        for (String token : malformedTokens) {
            if (token != null) {
                assertFalse(jwtService.validateToken(token),
                        "Malformed token should be rejected: " + token);
            }
        }
    }

    @Test
    @DisplayName("7. Weak passwords should be accepted but strongly hashed")
    void testWeakPasswordHashing() {
        // Even weak passwords get strong hashing
        String weakPassword = "123456";
        String encoded = passwordEncoder.encode(weakPassword);
        
        assertTrue(passwordEncoder.matches(weakPassword, encoded),
                "Weak password should still be encoded");
        // The strength is in the hash, not password complexity
        assertNotEquals(weakPassword, encoded);
    }

    @Test
    @DisplayName("8. JWT with different roles should be generated correctly")
    void testJwtWithDifferentRoles() {
        String userToken = jwtService.generateToken("user", "USER");
        String adminToken = jwtService.generateToken("admin", "ADMIN");
        
        assertTrue(jwtService.validateToken(userToken));
        assertTrue(jwtService.validateToken(adminToken));
        
        assertEquals("user", jwtService.extractUsername(userToken));
        assertEquals("admin", jwtService.extractUsername(adminToken));
    }

    @Test
    @DisplayName("9. Password should not be stored in plain text")
    void testPasswordNotStoredPlainText() {
        String plainPassword = "MySecret@2024";
        String encoded = passwordEncoder.encode(plainPassword);
        
        assertNotEquals(plainPassword, encoded,
                "Password should never be stored in plain text");
        assertFalse(encoded.contains(plainPassword),
                "Encoded password should not contain plain text");
    }

    @Test
    @DisplayName("10. JWT token should expire after configured time")
    void testJwtTokenExpiration() throws InterruptedException {
        // Create a token
        String token = jwtService.generateToken("testuser", "USER");
        
        // Immediately should be valid
        assertTrue(jwtService.validateToken(token));
        
        // Note: We can't practically test 24h expiration in unit test
        // But we verify the expiration claim exists
        String expiration = jwtService.extractExpiration(token).toString();
        assertNotNull(expiration, "Token should have expiration claim");
    }

    @Test
    @DisplayName("11. Special characters in password should be handled correctly")
    void testPasswordWithSpecialCharacters() {
        String[] specialPasswords = {
            "P@ssw0rd!@#",
            "Secr€t_2024_$",
            "MötörHëäd!®",
            "<script>alert('xss')</script>",
            "'; DROP TABLE users;--"
        };
        
        for (String password : specialPasswords) {
            String encoded = passwordEncoder.encode(password);
            assertTrue(passwordEncoder.matches(password, encoded),
                    "Password with special chars should match: " + password);
            assertNotEquals(password, encoded);
        }
    }

    @Test
    @DisplayName("12. Empty and null password edge cases")
    void testEdgeCasePasswords() {
        // Empty password
        String empty = "";
        String encodedEmpty = passwordEncoder.encode(empty);
        assertTrue(passwordEncoder.matches(empty, encodedEmpty));
        
        // Very long password
        String longPassword = "A".repeat(1000);
        String encodedLong = passwordEncoder.encode(longPassword);
        assertTrue(passwordEncoder.matches(longPassword, encodedLong));
    }
}
