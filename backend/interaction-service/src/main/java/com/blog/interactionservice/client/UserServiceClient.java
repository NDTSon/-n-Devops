package com.blog.interactionservice.client;

import com.blog.interactionservice.dto.UserInfoDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "user-service", url = "${services.user-service.url}")
public interface UserServiceClient {

    @GetMapping("/api/users/{id}")
    UserInfoDTO getUserById(@PathVariable("id") UUID id);

    // Kiểm tra mutual follow để hiển thị trong conversation
    @GetMapping("/api/follow/{userId}/status")
    java.util.Map<String, Object> getFollowStatus(
            @PathVariable("userId") UUID userId,
            @RequestHeader("X-User-Id") String currentUserId
    );
}
