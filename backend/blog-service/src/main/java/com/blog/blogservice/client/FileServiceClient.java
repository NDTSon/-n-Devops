package com.blog.blogservice.client;

import com.blog.blogservice.dto.FileUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Component
@Slf4j
public class FileServiceClient {
    
    private final RestTemplate restTemplate;
    
    @Value("${file.service.url:http://file-service:8083}")
    private String fileServiceUrl;
    
    public FileServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    /**
     * Upload file to file-service
     * @param file MultipartFile to upload
     * @param token JWT token for authentication
     * @param accessLevel Access level (PUBLIC, PRIVATE, RESTRICTED)
     * @param description File description
     * @return FileUploadResponse with fileId and downloadUrl
     * @throws Exception if upload fails
     */
    public FileUploadResponse uploadFile(MultipartFile file, String token, String accessLevel, String description) throws Exception {
        try {
            String uploadUrl = fileServiceUrl + "/api/files/upload";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Authorization", token);
            
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });
            
            if (accessLevel != null) {
                body.add("accessLevel", accessLevel);
            }
            
            if (description != null) {
                body.add("description", description);
            }
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            ResponseEntity<FileUploadResponse> response = restTemplate.postForEntity(
                    uploadUrl,
                    requestEntity,
                    FileUploadResponse.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("File uploaded successfully to file-service: {}", response.getBody().getFileId());
                return response.getBody();
            } else {
                throw new RuntimeException("Failed to upload file to file-service");
            }
            
        } catch (Exception e) {
            log.error("Error uploading file to file-service: {}", e.getMessage());
            throw new Exception("Failed to upload file: " + e.getMessage());
        }
    }
    
    /**
     * Delete file from file-service
     * @param fileId File ID to delete
     * @param token JWT token for authentication
     * @return true if deletion was successful
     */
    public boolean deleteFile(Long fileId, String token) {
        try {
            String deleteUrl = fileServiceUrl + "/api/files/" + fileId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);
            
            HttpEntity<?> requestEntity = new HttpEntity<>(headers);
            
            restTemplate.exchange(
                    deleteUrl,
                    HttpMethod.DELETE,
                    requestEntity,
                    String.class
            );
            
            log.info("File deleted successfully from file-service: {}", fileId);
            return true;
        } catch (Exception e) {
            log.error("Error deleting file from file-service: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Get download URL for a file
     * @param fileId File ID
     * @return Download URL
     */
    public String getDownloadUrl(Long fileId) {
        return fileServiceUrl + "/api/files/download/" + fileId;
    }
}
