package com.tcc.backend_TCC.config;

import com.tcc.backend_TCC.service.RateLimitingService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filter de Rate Limiting.
 * Intercepta TODAS as requisicoes antes de chegar nos controllers.
 */
@Component
public class RateLimitingFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

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

        log.debug("Requisicao recebida: {} {} | IP: {}", method, requestUri, clientIp);

        if ("OPTIONS".equalsIgnoreCase(method)) {
            // Preflight request: just let it pass through without rate limiting
            chain.doFilter(request, response);
            return;
        }

        try {
            handleGeneralRateLimit(httpRequest, httpResponse, chain, clientIp);
        } catch (Exception e) {
            // Fail-closed: em caso de erro no filtro, BLOQUEIA a requisicao por seguranca
            log.error("Erro no filtro de rate limiting. Bloqueando requisicao por seguranca.", e);
            httpResponse.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write(
                    "{\"error\": \"Servico temporariamente indisponivel. Tente novamente em instantes.\"}"
            );
        }
    }

    private void handleGeneralRateLimit(HttpServletRequest request, HttpServletResponse response,
                                        FilterChain chain, String clientIp)
            throws IOException, ServletException {

        if (!rateLimitingService.isAllowed(clientIp)) {
            log.warn("Requisicao BLOQUEADA (Rate Limit Exceeded)! IP: {}", clientIp);

            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\": \"Rate limit exceeded\", \"message\": \"Muitas requisicoes. Tente novamente em 1 minuto.\"}"
            );
            return;
        }

        chain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        String ip;

        if (xfHeader != null) {
            ip = xfHeader.split(",")[0].trim();
        } else {
            ip = request.getRemoteAddr();
        }

        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }

        return ip;
    }
}
