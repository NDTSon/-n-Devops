package com.blog.customerservice.repository;

import com.blog.customerservice.model.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<SupportTicket> findByStatusOrderByCreatedAtDesc(SupportTicket.TicketStatus status);
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
}

