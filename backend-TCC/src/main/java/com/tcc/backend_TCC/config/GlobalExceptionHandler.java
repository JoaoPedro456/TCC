package com.tcc.backend_TCC.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException; // <-- NOVO IMPORT AQUI

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. O teu tratador de validações (já existia)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", "Erro de validação: " + ex.getBindingResult().getAllErrors().get(0)));
    }

    // 2. O teu tratador de exceções genéricas (já existia)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", ex.getMessage()));
    }

    // 3. O teu tratador de erros críticos do servidor (já existia)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception ex) {
        ex.printStackTrace();
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("erro", "Erro interno no servidor: " + ex.getMessage()));
    }

    // =======================================================
    // 4. NOVO TRATADOR: Apenas para limpar a nossa mensagem!
    // =======================================================
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(ResponseStatusException ex) {
        return ResponseEntity
                .status(ex.getStatusCode()) // Pega o 400 automaticamente
                .body(Map.of("erro", ex.getReason())); // getReason() pega só o texto, sem o "400 BAD_REQUEST"
    }
}