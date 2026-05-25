package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.Usuario;
import com.tcc.backend_TCC.repository.UsuarioRepository;
import com.tcc.backend_TCC.security.AuthService;
import com.tcc.backend_TCC.service.RateLimitingService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @Autowired
    private RateLimitingService rateLimitingService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body,
                                   HttpServletRequest request) {
        String clientIp = getClientIp(request);
        log.info("Requisicao de login recebida. IP: {}", clientIp);

        String login = body.get("login");
        String senha = body.get("senha");

        if (login == null || senha == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Login e senha sao obrigatorios"));
        }

        // --- Rate Limiting para Login (Anti-Brute-Force) ---
        if (!rateLimitingService.isLoginAllowed(clientIp, login)) {
            long retryAfter = rateLimitingService.getLoginRetryAfterSeconds(clientIp, login);
            log.warn("LOGIN BLOQUEADO! IP: {}, Login: {}", clientIp, login);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(retryAfter))
                    .body(Map.of(
                            "error", "Muitas tentativas de login",
                            "message", "Tente novamente em " + (retryAfter / 60) + " minutos."
                    ));
        }

        try {
            String token = authService.login(login, senha);
            rateLimitingService.resetLoginAttempts(clientIp, login);
            log.info("Login bem-sucedido para: {}", login);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (Exception e) {
            // Registra a tentativa malsucedida para computar nos buckets/testes
            rateLimitingService.registerFailedAttempt(clientIp, login);
            log.warn("Login falhou para: {} - {}", login, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Login ou senha incorretos"));
        }
    }

    @PostMapping("/registrar")
    public ResponseEntity<Usuario> registrar(@RequestBody Map<String, String> body) {
        String login = body.get("login");
        String senha = body.get("senha");
        String role = body.get("role");

        if (login == null || login.isBlank() || senha == null || senha.isBlank() || role == null || role.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // Validar role permitida
        if (!"ADMIN".equals(role) && !"OPERADOR".equals(role)) {
            return ResponseEntity.badRequest().build();
        }

        log.info("Novo usuario registrado: {} com role: {}", login, role);
        Usuario usuario = authService.registrar(login, senha, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }

    /**
     * Endpoint para trocar a senha do usuario autenticado.
     * Requer autenticacao (token JWT valido).
     */
    @PutMapping("/alterar-senha")
    public ResponseEntity<?> alterarSenha(@RequestBody Map<String, String> body,
                                          HttpServletRequest request) {
        String senhaAtual = body.get("senhaAtual");
        String novaSenha = body.get("novaSenha");

        if (senhaAtual == null || senhaAtual.isBlank() || novaSenha == null || novaSenha.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Senha atual e nova senha sao obrigatorias"));
        }

        if (novaSenha.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nova senha deve ter no minimo 6 caracteres"));
        }

        // Extrai o login do token JWT (o Spring Security ja validou o token)
        String login = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        if (login == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario nao autenticado"));
        }

        Usuario usuario = usuarioRepository.findByLogin(login)
                .orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario nao encontrado"));
        }

        if (!passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Senha atual incorreta"));
        }

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);

        log.info("Senha alterada para o usuario: {}", login);
        return ResponseEntity.ok(Map.of("message", "Senha alterada com sucesso"));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}