package com.blog.blogservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {
    private Long fileId;
    private String originalFileName;
    private String storedFileName;
    private String contentType;
    private Long fileSize;
    private String seaweedfsFileId;
    private String downloadUrl;
    private String message;
}
