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

    public String login(String login, String senha) {
        Usuario usuario = usuarioRepository.findByLogin(login)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));

        if (!passwordEncoder.matches(senha, usuario.getSenha())) {
            throw new OperacaoInvalidaException("Senha incorreta");
        }

        return jwtService.gerarToken(login, usuario.getRole());
    }

    public Usuario registrar(String login, String senha, String role) {
        if (usuarioRepository.findByLogin(login).isPresent()) {
            throw new OperacaoInvalidaException("Login já existe");
        }
        Usuario u = new Usuario();
        u.setLogin(login);
        u.setSenha(passwordEncoder.encode(senha));
        u.setRole(role != null ? role : "OPERADOR");
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
