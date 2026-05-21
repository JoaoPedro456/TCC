package com.tcc.backend_TCC.config;

import com.tcc.backend_TCC.service.RateLimitingService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filter de Rate Limiting.
 * Intercepta TODAS as requisições antes de chegar nos controllers.
 */
@Component
public class RateLimitingFilter implements Filter {

    @Autowired
    private RateLimitingService rateLimitingService;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String clientIp = getClientIp(httpRequest);
        String requestUri = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();

        // LOG DE DEBUG: Mostra que o filtro foi acionado
        System.out.println("[RateLimitingFilter] Requisição recebida: " + method + " " + requestUri + " | IP: " + clientIp);

        try {
            // Verifica se é endpoint de LOGIN
            boolean isLoginEndpoint = isLoginRequest(requestUri, method);

            if (isLoginEndpoint) {
                // Login tem tratamento especial (mais restritivo)
                handleLoginRateLimit(httpRequest, httpResponse, chain, clientIp);
            } else {
                // API geral (limite padrão)
                handleGeneralRateLimit(httpRequest, httpResponse, chain, clientIp);
            }
        } catch (Exception e) {
            // Em caso de erro no filtro, NÃO bloqueia a requisição (fail-open)
            System.err.println("[RateLimitingFilter] ERRO NO FILTRO: " + e.getMessage());
            e.printStackTrace();
            chain.doFilter(request, response);
        }
    }

    private boolean isLoginRequest(String uri, String method) {
        return method.equalsIgnoreCase("POST") &&
                (uri.contains("/auth/login") || uri.contains("/login"));
    }

    private void handleLoginRateLimit(HttpServletRequest request, HttpServletResponse response,
                                      FilterChain chain, String clientIp)
            throws IOException, ServletException {

        String username = extractUsernameFromRequest(request);

        if (!rateLimitingService.isLoginAllowed(clientIp, username)) {
            long retryAfter = rateLimitingService.getLoginRetryAfterSeconds(clientIp, username);

            System.out.println("[RateLimitingFilter] LOGIN BLOQUEADO! IP: " + clientIp);

            response.setStatus(429);
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.getWriter().write(
                    "{\"error\": \"Muitas tentativas de login\", " +
                            "\"message\": \"Tente novamente em " + (retryAfter / 60) + " minutos.\"}"
            );
            return;
        }

        chain.doFilter(request, response);
    }

    private void handleGeneralRateLimit(HttpServletRequest request, HttpServletResponse response,
                                        FilterChain chain, String clientIp)
            throws IOException, ServletException {

        // LOG DE DEBUG: Mostra se está verificando o limite
        System.out.println("[RateLimitingFilter] Verificando limite geral para: " + request.getRequestURI());

        if (!rateLimitingService.isAllowed(clientIp)) {
            System.out.println("[RateLimitingFilter] REQUISIÇÃO BLOQUEADA (Rate Limit Exceeded)! IP: " + clientIp);

            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\": \"Rate limit exceeded\", \"message\": \"Muitas requisições. Tente novamente em 1 minuto.\"}"
            );
            return;
        }

        System.out.println("[RateLimitingFilter] Requisição PERMITIDA. Passando para o Controller.");
        chain.doFilter(request, response);
    }

    private String extractUsernameFromRequest(HttpServletRequest request) {
        String username = request.getHeader("X-Login-Username");
        if (username != null) {
            return username;
        }
        return null;
    }

    /**
     * Extrai o IP real do cliente (considerando proxies e normalizando localhost)
     */
    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        String ip;

        if (xfHeader != null) {
            ip = xfHeader.split(",")[0].trim();
        } else {
            ip = request.getRemoteAddr();
        }

        // Normaliza IPv6 localhost para IPv4 padrão
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }

        return ip;
    }
}
