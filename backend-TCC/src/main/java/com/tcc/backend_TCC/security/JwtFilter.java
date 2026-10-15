package com.tcc.backend_TCC.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private com.tcc.backend_TCC.repository.UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtService.tokenValido(token)) {
                String login = jwtService.extrairLogin(token);
                String role = jwtService.extrairRole(token);

                // Verifica se usuário existe no banco e se ainda está ativo
                var optUsuario = usuarioRepository.findByLogin(login);
                if (optUsuario.isPresent()) {
                    if (Boolean.FALSE.equals(optUsuario.get().getAtivo())) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Usuário inativo ou desativado\"}");
                        return;
                    }
                    if (optUsuario.get().getRole() != null) {
                        role = optUsuario.get().getRole();
                    }
                }

                // Se no banco estiver "ADMIN", aqui vira "ROLE_ADMIN"
                String authority = "ROLE_" + (role != null ? role.toUpperCase() : "OPERADOR");
                List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(authority));

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(login, null, authorities);
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}