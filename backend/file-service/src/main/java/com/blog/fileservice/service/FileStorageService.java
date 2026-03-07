package com.blog.fileservice.service;

import com.blog.fileservice.dto.FileMetadataDTO;
import com.blog.fileservice.dto.FileUploadResponse;
import com.blog.fileservice.entity.FileMetadata;
import com.blog.fileservice.repository.FileMetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FileStorageService {
    
    private final SeaweedFSService seaweedFSService;
    private final FileMetadataRepository fileMetadataRepository;
    
    // Allowed file types
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
        ".pdf",                                    // PDF files
        ".doc", ".docx",                          // Word documents
        ".xls", ".xlsx",                          // Excel spreadsheets
        ".txt",                                   // Text files
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",  // Image files
        ".mp4", ".webm", ".ogg", ".mov", ".avi"  // Video files
    );
    
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
        // PDF
        "application/pdf",
        // Word
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        // Excel
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        // Text
        "text/plain",
        // Images
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp", "image/webp",
        // Videos
        "video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"
    );
    
    public FileStorageService(SeaweedFSService seaweedFSService, FileMetadataRepository fileMetadataRepository) {
        this.seaweedFSService = seaweedFSService;
        this.fileMetadataRepository = fileMetadataRepository;
    }
    
    @Transactional
    public FileUploadResponse uploadFile(MultipartFile file, Long userId, String accessLevel, String description) throws Exception {
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        // Validate file type by extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IllegalArgumentException("File name is invalid");
        }
        
        String extension = "";
        if (originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }
        
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("File type not allowed. Allowed types: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Text (.txt), Images (.jpg, .jpeg, .png, .gif, .bmp, .webp), Videos (.mp4, .webm, .ogg, .mov, .avi)");
        }
        
        // Validate content type
        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("File content type not allowed: " + contentType);
        }
        
        // Generate unique stored filename
        String storedFileName = UUID.randomUUID().toString() + extension;
        
        // Upload to SeaweedFS
        Map<String, String> uploadResult = seaweedFSService.uploadFile(file);
        String seaweedfsFileId = uploadResult.get("fileId");
        String seaweedfsUrl = uploadResult.get("publicUrl");
        
        // Save metadata to database
        FileMetadata metadata = new FileMetadata();
        metadata.setOriginalFileName(originalFilename);
        metadata.setStoredFileName(storedFileName);
        metadata.setContentType(file.getContentType());
        metadata.setFileSize(file.getSize());
        metadata.setSeaweedfsFileId(seaweedfsFileId);
        metadata.setSeaweedfsUrl(seaweedfsUrl);
        metadata.setUploadedBy(userId);
        metadata.setAccessLevel(accessLevel != null ? accessLevel : "PUBLIC");
        metadata.setDescription(description);
        metadata.setIsDeleted(false);
        
        FileMetadata savedMetadata = fileMetadataRepository.save(metadata);
        
        // Build response
        FileUploadResponse response = new FileUploadResponse();
        response.setFileId(savedMetadata.getId());
        response.setOriginalFileName(savedMetadata.getOriginalFileName());
        response.setStoredFileName(savedMetadata.getStoredFileName());
        response.setContentType(savedMetadata.getContentType());
        response.setFileSize(savedMetadata.getFileSize());
        response.setSeaweedfsFileId(savedMetadata.getSeaweedfsFileId());
        response.setDownloadUrl("/api/files/download/" + savedMetadata.getId());
        response.setMessage("File uploaded successfully");
        
        return response;
    }
    
    public byte[] downloadFile(Long fileId) throws Exception {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        
        if (metadata.getIsDeleted()) {
            throw new RuntimeException("File has been deleted");
        }
        
        return seaweedFSService.downloadFile(metadata.getSeaweedfsFileId());
    }
    
    public FileMetadata getFileMetadata(Long fileId) {
        return fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
    }
    
    public List<FileMetadataDTO> getAllFiles() {
        return fileMetadataRepository.findByIsDeletedFalse().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<FileMetadataDTO> getFilesByUser(Long userId) {
        return fileMetadataRepository.findByUploadedByAndIsDeletedFalse(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void deleteFile(Long fileId, Long userId) throws Exception {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        
        if (!metadata.getUploadedBy().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this file");
        }
        
        // Soft delete in database
        metadata.setIsDeleted(true);
        metadata.setDeletedAt(LocalDateTime.now());
        fileMetadataRepository.save(metadata);
        
        // Delete from SeaweedFS
        seaweedFSService.deleteFile(metadata.getSeaweedfsFileId());
    }
    
    @Transactional
    public void deleteFileByAdmin(Long fileId) throws Exception {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        
        // Soft delete in database
        metadata.setIsDeleted(true);
        metadata.setDeletedAt(LocalDateTime.now());
        fileMetadataRepository.save(metadata);
        
        // Delete from SeaweedFS
        seaweedFSService.deleteFile(metadata.getSeaweedfsFileId());
    }
    
    private FileMetadataDTO convertToDTO(FileMetadata metadata) {
        FileMetadataDTO dto = new FileMetadataDTO();
        dto.setId(metadata.getId());
        dto.setOriginalFileName(metadata.getOriginalFileName());
        dto.setStoredFileName(metadata.getStoredFileName());
        dto.setContentType(metadata.getContentType());
        dto.setFileSize(metadata.getFileSize());
        dto.setSeaweedfsFileId(metadata.getSeaweedfsFileId());
        dto.setDownloadUrl("/api/files/download/" + metadata.getId());
        dto.setUploadedBy(metadata.getUploadedBy());
        dto.setUploadedAt(metadata.getUploadedAt());
        dto.setDescription(metadata.getDescription());
        dto.setAccessLevel(metadata.getAccessLevel());
        return dto;
    }
}
