package com.blog.interactionservice.service;

import com.blog.interactionservice.client.UserServiceClient;
import com.blog.interactionservice.dto.ConversationResponse;
import com.blog.interactionservice.dto.MessageRequest;
import com.blog.interactionservice.dto.MessageResponse;
import com.blog.interactionservice.dto.UserInfoDTO;
import com.blog.interactionservice.model.Message;
import com.blog.interactionservice.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserServiceClient userServiceClient;
    private final NotificationService notificationService;

    @Transactional
    public MessageResponse sendMessage(UUID senderId, UUID receiverId, MessageRequest request) {
        UserInfoDTO sender = userServiceClient.getUserById(senderId);
        UserInfoDTO receiver = userServiceClient.getUserById(receiverId);

        Message message = Message.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .content(request.getContent())
                .isRead(false)
                .build();

        message = messageRepository.save(message);

        // Notify receiver
        notificationService.createNewMessageNotification(receiverId, senderId, sender.getUsername());

        return toResponse(message, sender, receiver);
    }

    public List<MessageResponse> getMessagesBetweenUsers(UUID user1, UUID user2) {
        List<Message> messages = messageRepository.findMessagesBetweenUsers(user1, user2);
        return messages.stream()
                .map(m -> {
                    UserInfoDTO sender   = getUserSafe(m.getSenderId());
                    UserInfoDTO receiver = getUserSafe(m.getReceiverId());
                    if (sender == null || receiver == null) return null;
                    return toResponse(m, sender, receiver);
                })
                .filter(r -> r != null)
                .collect(Collectors.toList());
    }

    public List<ConversationResponse> getConversations(UUID userId) {
        List<UUID> partnerIds = messageRepository.findConversationPartners(userId);
        List<ConversationResponse> conversations = new ArrayList<>();

        for (UUID partnerId : partnerIds) {
            UserInfoDTO partner = getUserSafe(partnerId);
            if (partner == null) continue;

            boolean isMutual = false;
            try {
                Map<String, Object> status = userServiceClient.getFollowStatus(partnerId, userId.toString());
                isMutual = Boolean.TRUE.equals(status.get("isMutual"));
            } catch (Exception ignored) {}

            Message lastMessage = messageRepository.findLastMessageBetweenUsers(userId, partnerId);
            long unreadCount = messageRepository.countByReceiverIdAndIsReadFalse(userId);

            conversations.add(ConversationResponse.builder()
                    .userId(partner.getId())
                    .username(partner.getUsername())
                    .email(partner.getEmail())
                    .lastMessage(lastMessage != null ? lastMessage.getContent() : "")
                    .lastMessageTime(lastMessage != null ? lastMessage.getCreatedAt() : null)
                    .unreadCount(unreadCount)
                    .isMutualFollow(isMutual)
                    .build());
        }
        return conversations;
    }

    @Transactional
    public void markAsRead(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!message.getReceiverId().equals(userId)) {
            throw new IllegalArgumentException("Can only mark your own messages as read");
        }
        messageRepository.markAsRead(messageId);
    }

    @Transactional
    public void markAllAsReadFromSender(UUID receiverId, UUID senderId) {
        messageRepository.markAllAsReadFromSender(receiverId, senderId);
    }

    public long getUnreadCount(UUID userId) {
        return messageRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    private UserInfoDTO getUserSafe(UUID id) {
        try {
            return userServiceClient.getUserById(id);
        } catch (Exception e) {
            return null;
        }
    }

    private MessageResponse toResponse(Message m, UserInfoDTO sender, UserInfoDTO receiver) {
        return MessageResponse.builder()
                .id(m.getId())
                .senderId(sender.getId())
                .senderUsername(sender.getUsername())
                .receiverId(receiver.getId())
                .receiverUsername(receiver.getUsername())
                .content(m.getContent())
                .isRead(m.getIsRead())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
