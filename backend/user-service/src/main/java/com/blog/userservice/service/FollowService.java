package com.blog.userservice.service;

import com.blog.userservice.client.InteractionServiceClient;
import com.blog.userservice.dto.FollowResponse;
import com.blog.userservice.model.Follow;
import com.blog.userservice.model.User;
import com.blog.userservice.repository.FollowRepository;
import com.blog.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final InteractionServiceClient interactionServiceClient;

    @Transactional
    public void followUser(UUID followerId, UUID followingId) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        // Check if target user exists
        userRepository.findById(followingId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Check if already following
        if (followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new IllegalArgumentException("Already following this user");
        }

        // Create follow relationship
        Follow follow = Follow.builder()
                .followerId(followerId)
                .followingId(followingId)
                .build();
        followRepository.save(follow);

        // Get follower info for notification
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new IllegalArgumentException("Follower not found"));

        // Send notification to the followed user via interaction-service
        try {
            interactionServiceClient.notifyNewFollower(Map.of(
                "userId", followingId.toString(),
                "actorId", followerId.toString(),
                "actorUsername", follower.getUsername()
            ));
        } catch (Exception e) {
            log.warn("Failed to send follow notification: {}", e.getMessage());
        }
    }

    @Transactional
    public void unfollowUser(UUID followerId, UUID followingId) {
        if (!followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new IllegalArgumentException("Not following this user");
        }

        followRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);
    }

    public boolean isFollowing(UUID followerId, UUID followingId) {
        return followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    public boolean areMutualFollowers(UUID userId1, UUID userId2) {
        return followRepository.areMutualFollowers(userId1, userId2);
    }

    public List<FollowResponse> getFollowers(UUID userId) {
        List<Follow> follows = followRepository.findByFollowingId(userId);
        return follows.stream()
                .map(follow -> {
                    User user = userRepository.findById(follow.getFollowerId())
                            .orElse(null);
                    if (user == null) return null;
                    return FollowResponse.builder()
                            .id(follow.getId())
                            .userId(user.getId())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .followedAt(follow.getCreatedAt())
                            .build();
                })
                .filter(response -> response != null)
                .collect(Collectors.toList());
    }

    public List<FollowResponse> getFollowing(UUID userId) {
        List<Follow> follows = followRepository.findByFollowerId(userId);
        return follows.stream()
                .map(follow -> {
                    User user = userRepository.findById(follow.getFollowingId())
                            .orElse(null);
                    if (user == null) return null;
                    return FollowResponse.builder()
                            .id(follow.getId())
                            .userId(user.getId())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .followedAt(follow.getCreatedAt())
                            .build();
                })
                .filter(response -> response != null)
                .collect(Collectors.toList());
    }

    public long getFollowerCount(UUID userId) {
        return followRepository.countByFollowingId(userId);
    }

    public long getFollowingCount(UUID userId) {
        return followRepository.countByFollowerId(userId);
    }

    public List<UUID> getFollowingIds(UUID userId) {
        return followRepository.findFollowingIdsByFollowerId(userId);
    }

    public List<UUID> getFollowerIds(UUID userId) {
        List<Follow> follows = followRepository.findByFollowingId(userId);
        return follows.stream()
                .map(Follow::getFollowerId)
                .collect(Collectors.toList());
    }
}
