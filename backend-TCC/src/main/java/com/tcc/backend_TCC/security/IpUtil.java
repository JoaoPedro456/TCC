package com.tcc.backend_TCC.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.regex.Pattern;

/**
 * Utilitário seguro para extração e sanitização do IP do cliente.
 * Previne IP spoofing, Header injection e caracteres maliciosos.
 */
public final class IpUtil {

    private static final Pattern IP_PATTERN = Pattern.compile("^[0-9a-fA-F:.]+$");

    private IpUtil() {}

    public static String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }

        String xfHeader = request.getHeader("X-Forwarded-For");
        String ip = null;

        if (xfHeader != null && !xfHeader.isBlank()) {
            String[] parts = xfHeader.split(",");
            for (String part : parts) {
                String candidate = part.trim();
                if (isValid(candidate)) {
                    ip = candidate;
                    break;
                }
            }
        }

        if (ip == null || ip.isBlank() || !isValid(ip)) {
            ip = request.getRemoteAddr();
        }

        if (ip == null || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }

        return ip;
    }

    public static boolean isValid(String ip) {
        return ip != null && ip.length() >= 7 && ip.length() <= 45 && IP_PATTERN.matcher(ip).matches();
    }

    /**
     * Sanitiza strings que serão incluídas em logs para prevenir Log Injection (CRLF).
     */
    public static String sanitizeForLog(String input) {
        if (input == null) return "null";
        return input.replaceAll("[\\r\\n]", "_").trim();
    }
}
