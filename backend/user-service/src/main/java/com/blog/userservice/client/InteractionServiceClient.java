package com.blog.userservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "interaction-service", url = "${services.interaction-service.url}")
public interface InteractionServiceClient {

    @PostMapping("/api/internal/notifications/new-follower")
    void notifyNewFollower(@RequestBody Map<String, Object> request);
}
