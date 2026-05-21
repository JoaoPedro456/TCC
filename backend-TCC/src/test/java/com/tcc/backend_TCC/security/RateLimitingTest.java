package com.tcc.backend_TCC.security;

import com.tcc.backend_TCC.service.RateLimitingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

/**
 * RATE LIMITING TESTS
 * Tests for brute force protection and IP blocking
 */
@SpringBootTest
@DisplayName("🛡️ Rate Limiting Tests")
public class RateLimitingTest {

    @Autowired
    private RateLimitingService rateLimitingService;

    @Test
    @DisplayName("1. Rate limit service should be available")
    void testServiceAvailability() {
        assertNotNull(rateLimitingService, "Rate limiting service should be available");
    }

    @Test
    @DisplayName("2. Register failed attempts and check block status")
    void testRegisterFailedAttempts() {
        String ip = "192.168.1.100";
        String username = "testuser";

        assertFalse(rateLimitingService.isBlocked(ip, username),
                "Should not be blocked initially");

        for (int i = 1; i <= 5; i++) {
            rateLimitingService.registerFailedAttempt(ip, username);
            if (i < 5) {
                assertFalse(rateLimitingService.isBlocked(ip, username),
                        "Should not be blocked after " + i + " attempts");
            } else {
                assertTrue(rateLimitingService.isBlocked(ip, username),
                        "Should be blocked after 5 attempts");
            }
        }
    }

    @Test
    @DisplayName("3. Unblock IP address")
    void testUnblockIp() {
        String ip = "192.168.1.101";
        String username = "testuser2";

        for (int i = 0; i < 5; i++) {
            rateLimitingService.registerFailedAttempt(ip, username);
        }

        assertTrue(rateLimitingService.isBlocked(ip, username),
                "Should be blocked after 5 attempts");

        boolean unblocked = rateLimitingService.unblock(ip, null);
        assertTrue(unblocked, "Should successfully unblock IP");
        assertFalse(rateLimitingService.isBlocked(ip, username),
                "Should not be blocked after unblocking");
    }

    @Test
    @DisplayName("4. Unblock username")
    void testUnblockUsername() {
        String ip = "192.168.1.102";
        String username = "testuser3";

        for (int i = 0; i < 5; i++) {
            rateLimitingService.registerFailedAttempt(ip, username);
        }

        assertTrue(rateLimitingService.isBlocked(ip, username),
                "Should be blocked after 5 attempts");

        boolean unblocked = rateLimitingService.unblock(null, username);
        assertTrue(unblocked, "Should successfully unblock username");
    }

    @Test
    @DisplayName("5. Get blocked status")
    void testGetBlockedStatus() {
        String ip = "192.168.1.103";
        String username = "testuser4";

        for (int i = 0; i < 5; i++) {
            rateLimitingService.registerFailedAttempt(ip, username);
        }

        var status = rateLimitingService.getBlockedStatus();
        assertTrue((Boolean) status.get("isBlocked"),
                "Should report blocked status");
        assertEquals(5, ((Number) status.get("ipAttempts")).intValue(),
                "Should have 5 IP attempts");
        assertNotNull(status.get("ipBlockedUntil"),
                "Should have block expiration time");
    }

    @Test
    @DisplayName("6. Reset login attempts after successful login")
    void testResetLoginAttempts() {
        String ip = "192.168.1.104";
        String username = "testuser5";

        for (int i = 0; i < 3; i++) {
            rateLimitingService.registerFailedAttempt(ip, username);
        }

        assertTrue(rateLimitingService.isBlocked(ip, username) ||
                rateLimitingService.getBlockedStatus().get("ipAttempts").equals(3),
                "Should have 3 attempts");

        rateLimitingService.resetLoginAttempts(ip, username);

        assertFalse(rateLimitingService.isBlocked(ip, username),
                "Should not be blocked after reset");
    }

    @Test
    @DisplayName("7. IP blocking independent from username")
    void testIpIndependentBlocking() {
        String ip1 = "192.168.1.105";
        String ip2 = "192.168.1.106";
        String username = "sameuser";

        for (int i = 0; i < 5; i++) {
            rateLimitingService.registerFailedAttempt(ip1, username);
        }

        assertTrue(rateLimitingService.isBlocked(ip1, username),
                "IP1 should be blocked");
        assertFalse(rateLimitingService.isBlocked(ip2, username),
                "IP2 should not be blocked");
    }

    @Test
    @DisplayName("8. Username blocking independent from IP")
    void testUsernameIndependentBlocking() {
        String ip = "192.168.1.107";
        String user1 = "user1";
        String user2 = "user2";

        for (int i = 0; i < 5; i++) {
            rateLimitingService.registerFailedAttempt(ip, user1);
        }

        assertTrue(rateLimitingService.isBlocked(ip, user1),
                "User1 should be blocked");
        assertFalse(rateLimitingService.isBlocked(ip, user2),
                "User2 should not be blocked");
    }

    @Test
    @DisplayName("9. Multiple IPs same username")
    void testMultipleIpsSameUsername() {
        String username = "popularuser";

        for (int i = 1; i <= 3; i++) {
            String ip = "192.168.1." + (100 + i);
            for (int j = 0; j < 5; j++) {
                rateLimitingService.registerFailedAttempt(ip, username);
            }
            assertTrue(rateLimitingService.isBlocked(ip, username),
                    "IP " + i + " should be blocked");
        }
    }

    @Test
    @DisplayName("10. Block status returns correct data structure")
    void testStatusDataStructure() {
        var status = rateLimitingService.getBlockedStatus();

        assertTrue(status.containsKey("isBlocked"),
                "Status should contain isBlocked key");
        assertTrue(status.containsKey("ipAttempts"),
                "Status should contain ipAttempts key");
        assertTrue(status.containsKey("usernameAttempts"),
                "Status should contain usernameAttempts key");
        assertTrue(status.containsKey("ipBlockedUntil"),
                "Status should contain ipBlockedUntil key");

        assertEquals(0, ((Number) status.get("ipAttempts")).intValue(),
                "Initial IP attempts should be 0");
        assertEquals(0, ((Number) status.get("usernameAttempts")).intValue(),
                "Initial username attempts should be 0");
    }
}
