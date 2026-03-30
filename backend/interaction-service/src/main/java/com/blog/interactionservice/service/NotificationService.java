package com.blog.interactionservice.service;

import com.blog.interactionservice.dto.NotificationResponse;
import com.blog.interactionservice.model.Notification;
import com.blog.interactionservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void createNewPostNotification(UUID userId, UUID actorId, String actorUsername, UUID blogId, String blogTitle) {
        save(userId, Notification.NotificationType.NEW_POST,
                actorUsername + " đã đăng bài viết mới: " + blogTitle, blogId, actorId, actorUsername);
    }

    public void createCommentReplyNotification(UUID userId, UUID actorId, String actorUsername, UUID commentId, UUID blogId) {
        save(userId, Notification.NotificationType.COMMENT_REPLY,
                actorUsername + " đã trả lời bình luận của bạn", blogId, actorId, actorUsername);
    }

    public void createCommentOnPostNotification(UUID userId, UUID actorId, String actorUsername, UUID blogId, String blogTitle) {
        save(userId, Notification.NotificationType.COMMENT_ON_POST,
                actorUsername + " đã bình luận về bài viết: " + blogTitle, blogId, actorId, actorUsername);
    }

    public void createPostEditedNotification(UUID userId, String adminUsername, UUID blogId, String blogTitle) {
        save(userId, Notification.NotificationType.POST_EDITED,
                adminUsername + " đã chỉnh sửa bài viết của bạn: " + blogTitle, blogId, null, adminUsername);
    }

    public void createPostDeletedNotification(UUID userId, String adminUsername, String blogTitle) {
        save(userId, Notification.NotificationType.POST_DELETED,
                adminUsername + " đã xóa bài viết của bạn: " + blogTitle, null, null, adminUsername);
    }

    public void createPostPinnedNotification(UUID recipientId, UUID blogId, String blogTitle, String adminUsername) {
        save(recipientId, Notification.NotificationType.POST_PINNED,
                "Bài viết nổi bật: " + blogTitle + " (được ghim bởi " + adminUsername + ")", blogId, null, adminUsername);
    }

    public void createFollowNotification(UUID userId, UUID actorId, String actorUsername) {
        save(userId, Notification.NotificationType.NEW_FOLLOWER,
                actorUsername + " đã theo dõi bạn", actorId, actorId, actorUsername);
    }

    public void createNewMessageNotification(UUID userId, UUID actorId, String actorUsername) {
        save(userId, Notification.NotificationType.NEW_MESSAGE,
                actorUsername + " đã gửi tin nhắn cho bạn", actorId, actorId, actorUsername);
    }

    public void notifyFollowersAboutNewPost(List<UUID> followerIds, UUID authorId, String authorUsername, UUID blogId, String blogTitle) {
        for (UUID followerId : followerIds) {
            createNewPostNotification(followerId, authorId, authorUsername, blogId, blogTitle);
        }
    }

    public List<NotificationResponse> getAllNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<NotificationResponse> getUnreadNotifications(UUID userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(UUID notificationId) {
        notificationRepository.markAsRead(notificationId);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadForUser(userId);
    }

    @Transactional
    public void deleteReadNotifications(UUID userId) {
        notificationRepository.deleteReadNotifications(userId);
    }

    private void save(UUID userId, Notification.NotificationType type, String content,
                      UUID relatedId, UUID actorId, String actorUsername) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .content(content)
                .relatedId(relatedId)
                .actorId(actorId)
                .actorUsername(actorUsername)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType().name())
                .content(n.getContent())
                .relatedId(n.getRelatedId())
                .actorId(n.getActorId())
                .actorUsername(n.getActorUsername())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
