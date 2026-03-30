package com.blog.interactionservice.repository;

import com.blog.interactionservice.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("SELECT m FROM Message m " +
           "WHERE (m.senderId = :user1 AND m.receiverId = :user2) " +
           "OR (m.senderId = :user2 AND m.receiverId = :user1) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findMessagesBetweenUsers(@Param("user1") UUID user1, @Param("user2") UUID user2);

    @Query("SELECT DISTINCT CASE " +
           "WHEN m.senderId = :userId THEN m.receiverId " +
           "ELSE m.senderId END " +
           "FROM Message m " +
           "WHERE m.senderId = :userId OR m.receiverId = :userId")
    List<UUID> findConversationPartners(@Param("userId") UUID userId);

    long countByReceiverIdAndIsReadFalse(UUID receiverId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.id = :id")
    void markAsRead(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true " +
           "WHERE m.receiverId = :receiverId AND m.senderId = :senderId AND m.isRead = false")
    void markAllAsReadFromSender(@Param("receiverId") UUID receiverId, @Param("senderId") UUID senderId);

    @Query("SELECT m FROM Message m " +
           "WHERE (m.senderId = :user1 AND m.receiverId = :user2) " +
           "OR (m.senderId = :user2 AND m.receiverId = :user1) " +
           "ORDER BY m.createdAt DESC LIMIT 1")
    Message findLastMessageBetweenUsers(@Param("user1") UUID user1, @Param("user2") UUID user2);
}
