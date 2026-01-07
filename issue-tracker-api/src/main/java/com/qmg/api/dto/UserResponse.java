package com.qmg.api.dto;

import java.time.Instant;
import java.util.UUID;

public class UserResponse {
    public UUID id;
    public String email;
    public String name;
    public Instant createdAt;

    public UserResponse(UUID id, String email, String name, Instant createdAt) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.createdAt = createdAt;
    }
}
