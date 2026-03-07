package com.blog.blogservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "blogs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Blog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 500)
    private String imageUrl;

    @Column(name = "image_file_id")
    private Long imageFileId;

    @Column(name = "image_mime_type", length = 100)
    private String imageMimeType;

    @Column(name = "original_file_name", length = 255)
    private String originalFileName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean status = true; // true = active, false = inactive

    @Column(nullable = false)
    @Builder.Default
    private Boolean pinned = false; // true = pinned (featured), false = normal

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "author_username", nullable = false, length = 50)
    private String authorUsername;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
