package com.blog.fileservice.dto;

public class FileUploadResponse {
    private Long fileId;
    private String originalFileName;
    private String storedFileName;
    private String contentType;
    private Long fileSize;
    private String seaweedfsFileId;
    private String downloadUrl;
    private String message;
    
    // Getters and Setters
    public Long getFileId() {
        return fileId;
    }
    
    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }
    
    public String getOriginalFileName() {
        return originalFileName;
    }
    
    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }
    
    public String getStoredFileName() {
        return storedFileName;
    }
    
    public void setStoredFileName(String storedFileName) {
        this.storedFileName = storedFileName;
    }
    
    public String getContentType() {
        return contentType;
    }
    
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public String getSeaweedfsFileId() {
        return seaweedfsFileId;
    }
    
    public void setSeaweedfsFileId(String seaweedfsFileId) {
        this.seaweedfsFileId = seaweedfsFileId;
    }
    
    public String getDownloadUrl() {
        return downloadUrl;
    }
    
    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
}
