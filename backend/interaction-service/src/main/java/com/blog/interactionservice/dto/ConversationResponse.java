package com.blog.interactionservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ConversationResponse {
    private UUID userId;
    private String username;
    private String email;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private long unreadCount;
    private boolean isMutualFollow;
}
