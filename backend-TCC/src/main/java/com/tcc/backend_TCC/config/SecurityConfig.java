package com.tcc.backend_TCC.config;

import com.tcc.backend_TCC.security.JwtFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. CONFIGURAÇÃO DE CORS (CORRIGIDA PARA VITE PORTA 5173)
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(List.of("http://localhost:5173")); // Porta do seu Vite
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(List.of("*"));
                    config.setAllowCredentials(true);
                    return config;
                }))

                // 2. DESABILITA CSRF (Necessário para APIs Stateless)
                .csrf(csrf -> csrf.disable())

                // 3. CONFIGURA SESSÃO COMO STATELESS (Uso de JWT)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. REGRAS DE PERMISSÃO
                .authorizeHttpRequests(auth -> auth
                        // Libera o Login e o H2 Console
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()

                        // Libera o GET de pessoas para você conseguir listar sem erro 403 enquanto testa
                        .requestMatchers(HttpMethod.GET, "/api/pessoa/**").permitAll()

                        // Exige ADMIN para registrar novos usuários
                        .requestMatchers("/api/auth/registrar").hasRole("ADMIN")

                        // Qualquer outra requisição (POST, PUT, DELETE de pessoas, etc) exige Token
                        .anyRequest().authenticated()
                )

                // Permite carregar o console do H2 em frames (necessário para o banco H2)
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))

                // 5. ADICIONA O FILTRO JWT ANTES DO FILTRO DE AUTENTICAÇÃO PADRÃO
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}