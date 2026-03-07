package com.blog.fileservice.controller;

import com.blog.fileservice.dto.FileMetadataDTO;
import com.blog.fileservice.dto.FileUploadResponse;
import com.blog.fileservice.entity.FileMetadata;
import com.blog.fileservice.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {
    
    private static final Logger log = LoggerFactory.getLogger(FileController.class);
    
    private final FileStorageService fileStorageService;
    
    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }
    
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "accessLevel", defaultValue = "PUBLIC") String accessLevel,
            @RequestParam(value = "description", required = false) String description,
            Authentication authentication
    ) {
        try {
            log.info("Received file upload request - filename: {}, size: {} bytes", 
                    file.getOriginalFilename(), file.getSize());
            
            Long userId = (Long) authentication.getPrincipal();
            FileUploadResponse response = fileStorageService.uploadFile(file, userId, accessLevel, description);
            
            log.info("File uploaded successfully - fileId: {}, seaweedfsFileId: {}", 
                    response.getFileId(), response.getSeaweedfsFileId());
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Invalid file upload request: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Failed to upload file: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {
        try {
            byte[] fileData = fileStorageService.downloadFile(fileId);
            FileMetadata metadata = fileStorageService.getFileMetadata(fileId);
            
            ByteArrayResource resource = new ByteArrayResource(fileData);
            
            // Use inline disposition for images, PDFs, text files, and videos (viewable in browser), attachment for other files
            String contentType = metadata.getContentType();
            String disposition = (contentType.startsWith("image/") || 
                                 contentType.equals("application/pdf") || 
                                 contentType.startsWith("text/") ||
                                 contentType.startsWith("video/"))
                    ? "inline; filename=\"" + metadata.getOriginalFileName() + "\""
                    : "attachment; filename=\"" + metadata.getOriginalFileName() + "\"";
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    
    @GetMapping("/{fileId}")
    public ResponseEntity<?> getFileMetadata(@PathVariable Long fileId) {
        try {
            FileMetadata metadata = fileStorageService.getFileMetadata(fileId);
            return ResponseEntity.ok(metadata);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<FileMetadataDTO>> getAllFiles() {
        List<FileMetadataDTO> files = fileStorageService.getAllFiles();
        return ResponseEntity.ok(files);
    }
    
    @GetMapping("/my-files")
    public ResponseEntity<List<FileMetadataDTO>> getMyFiles(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<FileMetadataDTO> files = fileStorageService.getFilesByUser(userId);
        return ResponseEntity.ok(files);
    }
    
    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(@PathVariable Long fileId, Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            fileStorageService.deleteFile(fileId, userId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "File deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
    
    @DeleteMapping("/admin/{fileId}")
    public ResponseEntity<?> deleteFileByAdmin(@PathVariable Long fileId) {
        try {
            fileStorageService.deleteFileByAdmin(fileId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "File deleted successfully by admin");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "file-service");
        return ResponseEntity.ok(response);
    }
}
