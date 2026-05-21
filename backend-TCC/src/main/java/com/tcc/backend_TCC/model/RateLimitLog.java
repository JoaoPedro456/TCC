package com.tcc.backend_TCC.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rate_limit_logs")
public class RateLimitLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ipAddress;

    private String username; // Opcional, se for login

    @Column(nullable = false)
    private LocalDateTime blockedAt;

    private String reason; // "LOGIN_IP", "LOGIN_USER", "API_GENERAL"

    // Construtores, Getters e Setters
    public RateLimitLog() {}

    public RateLimitLog(String ipAddress, String username, String reason) {
        this.ipAddress = ipAddress;
        this.username = username;
        this.reason = reason;
        this.blockedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getBlockedAt() {
        return blockedAt;
    }

    public void setBlockedAt(LocalDateTime blockedAt) {
        this.blockedAt = blockedAt;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
