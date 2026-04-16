package com.tcc.backend_TCC.security;

import com.tcc.backend_TCC.exception.OperacaoInvalidaException;
import com.tcc.backend_TCC.exception.RecursoNaoEncontradoException;
import com.tcc.backend_TCC.model.Usuario;
import com.tcc.backend_TCC.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    void login_comSucesso_retornaToken() {
        Usuario usuario = new Usuario();
        usuario.setLogin("admin");
        usuario.setSenha("$2a$10hash");
        usuario.setRole("ADMIN");

        when(usuarioRepository.findByLogin("admin")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("123456", "$2a$10hash")).thenReturn(true);
        when(jwtService.gerarToken("admin", "ADMIN")).thenReturn("token.jwt");

        String token = authService.login("admin", "123456");

        assertEquals("token.jwt", token);
    }

    @Test
    void login_usuarioNaoEncontrado_lancaExcecao() {
        when(usuarioRepository.findByLogin("inexistente")).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () ->
                authService.login("inexistente", "123456"));
    }

    @Test
    void login_senhaIncorreta_lancaExcecao() {
        Usuario usuario = new Usuario();
        usuario.setLogin("admin");
        usuario.setSenha("$2a$10hash");
        usuario.setRole("ADMIN");

        when(usuarioRepository.findByLogin("admin")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("errada", "$2a$10hash")).thenReturn(false);

        assertThrows(OperacaoInvalidaException.class, () ->
                authService.login("admin", "errada"));
    }

    @Test
    void registrar_comSucesso_retornaUsuario() {
        Usuario salvo = new Usuario();
        salvo.setLogin("novo");
        salvo.setSenha("hash");
        salvo.setRole("OPERADOR");

        when(usuarioRepository.findByLogin("novo")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("senha123")).thenReturn("hash");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(salvo);

        Usuario resultado = authService.registrar("novo", "senha123", "OPERADOR");

        assertEquals("novo", resultado.getLogin());
        assertEquals("hash", resultado.getSenha());
        assertEquals("OPERADOR", resultado.getRole());
        verify(usuarioRepository).save(argThat(u ->
                u.getLogin().equals("novo") &&
                u.getSenha().equals("hash") &&
                u.getRole().equals("OPERADOR")
        ));
    }

    @Test
    void registrar_loginDuplicado_lancaExcecao() {
        Usuario existente = new Usuario();
        existente.setLogin("admin");

        when(usuarioRepository.findByLogin("admin")).thenReturn(Optional.of(existente));

        assertThrows(OperacaoInvalidaException.class, () ->
                authService.registrar("admin", "senha123", "ADMIN"));
    }

    @Test
    void registrar_semRole_defineComoOperador() {
        Usuario salvo = new Usuario();
        salvo.setLogin("novo");
        salvo.setSenha("hash");
        salvo.setRole("OPERADOR");

        when(usuarioRepository.findByLogin("novo")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("senha123")).thenReturn("hash");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(salvo);

        Usuario resultado = authService.registrar("novo", "senha123", null);

        assertEquals("OPERADOR", resultado.getRole());
    }
}
