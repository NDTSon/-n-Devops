package com.blog.customerservice.controller;

import com.blog.customerservice.dto.AiAssistRequest;
import com.blog.customerservice.dto.UpdateAiModelRequest;
import com.blog.customerservice.service.AiSupportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@RestController
@RequestMapping("/api/support/ai")
@RequiredArgsConstructor
public class AiSupportController {

    private final AiSupportService aiSupportService;

    @PostMapping("/assist")
    public ResponseEntity<?> assist(@Valid @RequestBody AiAssistRequest request, HttpServletRequest httpRequest) {
        UUID userId = (UUID) httpRequest.getAttribute("userId");
        String role = (String) httpRequest.getAttribute("role");
        return ResponseEntity.ok(aiSupportService.askAssistant(userId, role, request));
    }

    @GetMapping("/models")
    public ResponseEntity<?> getModels() {
        return ResponseEntity.ok(Map.of(
                "currentModel", aiSupportService.getActiveModel(),
                "models", aiSupportService.getSupportedModels()
        ));
    }

    @GetMapping("/models/stats")
    public ResponseEntity<?> getModelStats() {
        return ResponseEntity.ok(Map.of(
                "currentModel", aiSupportService.getActiveModel(),
                "stats", aiSupportService.getModelStats()
        ));
    }

    @PutMapping("/models/current")
    public ResponseEntity<?> updateModel(@Valid @RequestBody UpdateAiModelRequest request,
                                         HttpServletRequest httpRequest) {
        String role = (String) httpRequest.getAttribute("role");
        requireAdmin(role);
        String updated = aiSupportService.updateActiveModel(request.getModel());
        return ResponseEntity.ok(Map.of("currentModel", updated));
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(FORBIDDEN, "Only admin can change AI model");
        }
    }
}

