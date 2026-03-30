package com.blog.customerservice.service;

import com.blog.customerservice.dto.*;
import com.blog.customerservice.model.SupportTicket;
import com.blog.customerservice.model.TicketMessage;
import com.blog.customerservice.repository.SupportTicketRepository;
import com.blog.customerservice.repository.TicketMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final TicketMessageRepository ticketMessageRepository;

    public TicketResponse createTicket(UUID userId, String username, String role, CreateTicketRequest request) {
        SupportTicket.TicketPriority requestedPriority = request.getPriority() == null
                ? SupportTicket.TicketPriority.NORMAL
                : request.getPriority();

        if (!isPriorityManagerRole(role) && requestedPriority != SupportTicket.TicketPriority.NORMAL) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only support/admin can set ticket priority");
        }

        SupportTicket ticket = SupportTicket.builder()
                .userId(userId)
                .username(username)
                .subject(request.getSubject())
                .description(request.getDescription())
                .priority(requestedPriority)
                .status(SupportTicket.TicketStatus.OPEN)
                .build();

        SupportTicket saved = supportTicketRepository.save(ticket);
        return toResponse(saved, List.of());
    }

    public List<TicketResponse> getMyTickets(UUID userId) {
        return supportTicketRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ticket -> toResponse(ticket, List.of()))
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getAllTickets(String role, SupportTicket.TicketStatus status) {
        if (!isSupportRole(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only support/admin can view all tickets");
        }

        List<SupportTicket> tickets = status == null
                ? supportTicketRepository.findAllByOrderByCreatedAtDesc()
                : supportTicketRepository.findByStatusOrderByCreatedAtDesc(status);

        return tickets.stream()
                .map(ticket -> toResponse(ticket, List.of()))
                .collect(Collectors.toList());
    }

    public TicketResponse getTicketDetail(UUID ticketId, UUID currentUserId, String role) {
        SupportTicket ticket = findTicket(ticketId);
        ensureCanAccessTicket(ticket, currentUserId, role);
        return toResponse(ticket, getTicketMessages(ticketId));
    }

    public TicketResponse updateStatus(UUID ticketId,
                                       String role,
                                       UUID operatorId,
                                       UpdateTicketStatusRequest request) {
        if (!isSupportRole(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only support/admin can update ticket status");
        }
        SupportTicket ticket = findTicket(ticketId);
        ticket.setStatus(request.getStatus());
        if (ticket.getAssignedTo() == null) {
            ticket.setAssignedTo(operatorId);
        }
        return toResponse(supportTicketRepository.save(ticket), getTicketMessages(ticketId));
    }

    public TicketResponse updatePriority(UUID ticketId,
                                         String role,
                                         UUID operatorId,
                                         UpdateTicketPriorityRequest request) {
        if (!isPriorityManagerRole(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only support/admin can update ticket priority");
        }
        SupportTicket ticket = findTicket(ticketId);
        ticket.setPriority(request.getPriority());
        if (ticket.getAssignedTo() == null) {
            ticket.setAssignedTo(operatorId);
        }
        return toResponse(supportTicketRepository.save(ticket), getTicketMessages(ticketId));
    }

    public TicketMessageResponse addMessage(UUID ticketId,
                                            UUID senderId,
                                            String senderUsername,
                                            String senderRole,
                                            TicketMessageRequest request) {
        SupportTicket ticket = findTicket(ticketId);
        ensureCanAccessTicket(ticket, senderId, senderRole);

        TicketMessage message = TicketMessage.builder()
                .ticketId(ticketId)
                .senderId(senderId)
                .senderUsername(senderUsername)
                .senderRole(senderRole)
                .message(request.getMessage())
                .build();
        TicketMessage saved = ticketMessageRepository.save(message);

        if (ticket.getStatus() == SupportTicket.TicketStatus.OPEN && isSupportRole(senderRole)) {
            ticket.setStatus(SupportTicket.TicketStatus.IN_PROGRESS);
            if (ticket.getAssignedTo() == null) {
                ticket.setAssignedTo(senderId);
            }
            supportTicketRepository.save(ticket);
        }

        return toMessageResponse(saved);
    }

    public List<TicketMessageResponse> getTicketMessages(UUID ticketId, UUID currentUserId, String role) {
        SupportTicket ticket = findTicket(ticketId);
        ensureCanAccessTicket(ticket, currentUserId, role);
        return getTicketMessages(ticketId);
    }

    public SupportTicket findTicket(UUID ticketId) {
        return supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
    }

    private List<TicketMessageResponse> getTicketMessages(UUID ticketId) {
        return ticketMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::toMessageResponse)
                .collect(Collectors.toList());
    }

    private void ensureCanAccessTicket(SupportTicket ticket, UUID currentUserId, String role) {
        if (isSupportRole(role)) {
            return;
        }
        if (!Objects.equals(ticket.getUserId(), currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this ticket");
        }
    }

    private boolean isSupportRole(String role) {
        if (role == null) {
            return false;
        }
        return "ADMIN".equalsIgnoreCase(role) || "SUPPORT".equalsIgnoreCase(role) || "MODERATOR".equalsIgnoreCase(role);
    }

    private boolean isPriorityManagerRole(String role) {
        if (role == null) {
            return false;
        }
        return "ADMIN".equalsIgnoreCase(role) || "SUPPORT".equalsIgnoreCase(role);
    }

    private TicketResponse toResponse(SupportTicket ticket, List<TicketMessageResponse> messages) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .userId(ticket.getUserId())
                .username(ticket.getUsername())
                .subject(ticket.getSubject())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .assignedTo(ticket.getAssignedTo())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .messages(messages)
                .build();
    }

    private TicketMessageResponse toMessageResponse(TicketMessage message) {
        return TicketMessageResponse.builder()
                .id(message.getId())
                .ticketId(message.getTicketId())
                .senderId(message.getSenderId())
                .senderUsername(message.getSenderUsername())
                .senderRole(message.getSenderRole())
                .message(message.getMessage())
                .createdAt(message.getCreatedAt())
                .build();
    }
}

