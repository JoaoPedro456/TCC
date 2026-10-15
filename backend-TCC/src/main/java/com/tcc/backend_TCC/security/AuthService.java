package com.tcc.backend_TCC.security;

import com.tcc.backend_TCC.exception.OperacaoInvalidaException;
import com.tcc.backend_TCC.exception.RecursoNaoEncontradoException;
import com.tcc.backend_TCC.model.Usuario;
import com.tcc.backend_TCC.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Dummy hash para mitigar enumeração de usuários por medição de tempo (Timing Attack)
    private static final String DUMMY_HASH = "$2a$12$e8y0JkC5.V8r5h54Fz4kIekvjC47k9bX3a4sO6hZqE9yH8e0l3F8i";

    public String login(String login, String senha) {
        java.util.Optional<Usuario> optUsuario = usuarioRepository.findByLogin(login);
        if (optUsuario.isEmpty()) {
            // Executa verificação dummy para manter o tempo de resposta equivalente ao de usuário existente
            try {
                passwordEncoder.matches(senha, DUMMY_HASH);
            } catch (Exception ignored) {}
            throw new RecursoNaoEncontradoException("Usuário não encontrado");
        }

        Usuario usuario = optUsuario.get();
        if (!passwordEncoder.matches(senha, usuario.getSenha())) {
            throw new OperacaoInvalidaException("Senha incorreta");
        }

        return jwtService.gerarToken(login, usuario.getRole());
    }

    public Usuario registrar(String login, String senha, String role) {
        if (login == null || login.trim().length() < 3 || login.trim().length() > 50) {
            throw new OperacaoInvalidaException("Login deve ter entre 3 e 50 caracteres");
        }
        if (senha == null || senha.length() < 6) {
            throw new OperacaoInvalidaException("Senha deve ter no mínimo 6 caracteres");
        }
        if (usuarioRepository.findByLogin(login.trim()).isPresent()) {
            throw new OperacaoInvalidaException("Login já existe");
        }
        Usuario u = new Usuario();
        u.setLogin(login.trim());
        u.setSenha(passwordEncoder.encode(senha));
        u.setRole(role != null ? role.trim().toUpperCase() : "OPERADOR");
        return usuarioRepository.save(u);
    }

    // Methods for security testing
    public String generateTestToken(String login, String role) {
        return jwtService.gerarToken(login, role);
    }

    public boolean validateTestToken(String token) {
        return jwtService.tokenValido(token);
    }
    
    public String extractUsernameTest(String token) {
        return jwtService.extrairLogin(token);
    }
}
