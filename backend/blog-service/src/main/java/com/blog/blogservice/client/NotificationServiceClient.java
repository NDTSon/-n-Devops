package com.blog.blogservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "notification-service", url = "${services.interaction-service.url}")
public interface NotificationServiceClient {
    
    @PostMapping("/api/internal/notifications/new-post")
    void notifyNewPost(@RequestBody Map<String, Object> request);
    
    @PostMapping("/api/internal/notifications/comment-on-post")
    void notifyCommentOnPost(@RequestBody Map<String, Object> request);
    
    @PostMapping("/api/internal/notifications/comment-reply")
    void notifyCommentReply(@RequestBody Map<String, Object> request);
    
    @PostMapping("/api/internal/notifications/post-edited")
    void notifyPostEdited(@RequestBody Map<String, Object> request);
    
    @PostMapping("/api/internal/notifications/post-deleted")
    void notifyPostDeleted(@RequestBody Map<String, Object> request);
    
    @PostMapping("/api/internal/notifications/post-pinned")
    void notifyPostPinned(@RequestBody Map<String, Object> request);
}
