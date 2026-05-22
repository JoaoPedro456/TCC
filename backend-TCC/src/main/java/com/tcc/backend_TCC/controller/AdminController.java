package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.service.RateLimitingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller admin para gerenciamento do sistema.
 * Acesso restrito a usuários com role ADMIN.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private RateLimitingService rateLimitingService;

    /**
     * Desbloqueia um IP ou usuário do rate limiting.
     * Endpoint aberto (não requer autenticação) para facilitar testes.
     * Em produção, considere proteger com autenticação.
     * 
     * POST /api/admin/unblock
     * Body: { "ip": "192.168.1.1", "username": "joao" }
     */
    @PostMapping("/unblock")
    public ResponseEntity<Map<String, Object>> unblock(@RequestBody Map<String, String> body) {
        String ip = body.get("ip");
        String username = body.get("username");
        
        if ((ip == null || ip.isBlank()) && (username == null || username.isBlank())) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Envie 'ip' ou 'username' (ou ambos)"
            ));
        }
        
        boolean removed = rateLimitingService.unblock(ip, username);
        
        if (removed) {
            return ResponseEntity.ok(Map.of(
                "message", "Desbloqueado com sucesso",
                "ip", ip != null ? ip : "n/a",
                "username", username != null ? username : "n/a"
            ));
        } else {
            return ResponseEntity.ok(Map.of(
                "message", "Nenhum bloqueio encontrado (já estava desbloqueado ou não existia)",
                "ip", ip != null ? ip : "n/a",
                "username", username != null ? username : "n/a"
            ));
        }
    }
    
    /**
     * Lista IPs e usuários atualmente bloqueados.
     * Endpoint aberto para facilitar debug.
     * 
     * GET /api/admin/ratelimit/status
     */
    @GetMapping("/ratelimit/status")
    public ResponseEntity<Map<String, Object>> getRateLimitStatus() {
        return ResponseEntity.ok(rateLimitingService.getBlockedStatus());
    }
}
