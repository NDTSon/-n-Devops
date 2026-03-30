package com.blog.interactionservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    @Column(nullable = false, length = 500)
    private String content;

    @Column(name = "related_id")
    private UUID relatedId;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_username", length = 50)
    private String actorUsername;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum NotificationType {
        NEW_POST,
        COMMENT_REPLY,
        COMMENT_ON_POST,
        POST_EDITED,
        POST_DELETED,
        POST_PINNED,
        NEW_FOLLOWER,
        NEW_MESSAGE
    }
}
