package com.blog.interactionservice.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserInfoDTO {
    private UUID id;
    private String username;
    private String email;
    private String role;
    private Boolean enabled;
    private Boolean showEmail;
    private LocalDateTime createdAt;
}
