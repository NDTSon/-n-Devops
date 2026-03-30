package com.blog.customerservice.controller;

import com.blog.customerservice.dto.*;
import com.blog.customerservice.model.SupportTicket;
import com.blog.customerservice.service.TicketService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/support/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<?> createTicket(@Valid @RequestBody CreateTicketRequest request, HttpServletRequest httpRequest) {
        UUID userId = getUserId(httpRequest);
        String username = getUsername(httpRequest);
        String role = getRole(httpRequest);
        if (userId == null || username == null) {
            return unauthorized();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.createTicket(userId, username, role, request));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyTickets(HttpServletRequest request) {
        UUID userId = getUserId(request);
        if (userId == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(ticketService.getMyTickets(userId));
    }

    @GetMapping
    public ResponseEntity<?> getAllTickets(@RequestParam(required = false) SupportTicket.TicketStatus status,
                                           HttpServletRequest request) {
        String role = getRole(request);
        return ResponseEntity.ok(ticketService.getAllTickets(role, status));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<?> getTicketDetail(@PathVariable UUID ticketId, HttpServletRequest request) {
        UUID userId = getUserId(request);
        String role = getRole(request);
        if (userId == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(ticketService.getTicketDetail(ticketId, userId, role));
    }

    @PutMapping("/{ticketId}/status")
    public ResponseEntity<?> updateTicketStatus(@PathVariable UUID ticketId,
                                                @Valid @RequestBody UpdateTicketStatusRequest request,
                                                HttpServletRequest httpRequest) {
        UUID userId = getUserId(httpRequest);
        String role = getRole(httpRequest);
        if (userId == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(ticketService.updateStatus(ticketId, role, userId, request));
    }

    @PutMapping("/{ticketId}/priority")
    public ResponseEntity<?> updateTicketPriority(@PathVariable UUID ticketId,
                                                  @Valid @RequestBody UpdateTicketPriorityRequest request,
                                                  HttpServletRequest httpRequest) {
        UUID userId = getUserId(httpRequest);
        String role = getRole(httpRequest);
        if (userId == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(ticketService.updatePriority(ticketId, role, userId, request));
    }

    @PostMapping("/{ticketId}/messages")
    public ResponseEntity<?> addMessage(@PathVariable UUID ticketId,
                                        @Valid @RequestBody TicketMessageRequest request,
                                        HttpServletRequest httpRequest) {
        UUID userId = getUserId(httpRequest);
        String username = getUsername(httpRequest);
        String role = getRole(httpRequest);
        if (userId == null || username == null || role == null) {
            return unauthorized();
        }

        TicketMessageResponse response = ticketService.addMessage(ticketId, userId, username, role, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{ticketId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable UUID ticketId, HttpServletRequest request) {
        UUID userId = getUserId(request);
        String role = getRole(request);
        if (userId == null) {
            return unauthorized();
        }
        List<TicketMessageResponse> messages = ticketService.getTicketMessages(ticketId, userId, role);
        return ResponseEntity.ok(messages);
    }

    private UUID getUserId(HttpServletRequest request) {
        return (UUID) request.getAttribute("userId");
    }

    private String getUsername(HttpServletRequest request) {
        return (String) request.getAttribute("username");
    }

    private String getRole(HttpServletRequest request) {
        return (String) request.getAttribute("role");
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
    }
}

