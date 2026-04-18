package com.example.projectflow.controller;

import com.example.projectflow.dto.ApiResponse;
import com.example.projectflow.dto.attachment.AttachmentResponse;
import com.example.projectflow.service.AttachmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
@Tag(name = "Attachments", description = "Endpoints for managing file attachments")
@SecurityRequirement(name = "bearerAuth")
public class AttachmentController {

    private final AttachmentService attachmentService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload a file to a project or task")
    public ResponseEntity<ApiResponse<AttachmentResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "projectId", required = false) Long projectId,
            @RequestParam(value = "taskId", required = false) Long taskId,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully",
                        attachmentService.uploadFile(file, projectId, taskId, auth.getName())));
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all attachments for a project")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> getProjectAttachments(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success("Attachments retrieved successfully",
                attachmentService.getProjectAttachments(projectId)));
    }

    @GetMapping("/task/{taskId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all attachments for a task")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> getTaskAttachments(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success("Attachments retrieved successfully",
                attachmentService.getTaskAttachments(taskId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete an attachment")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(@PathVariable Long id, Authentication auth) {
        attachmentService.deleteFile(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Attachment deleted successfully", null));
    }

    /**
     * Serve the actual file bytes — required so the browser can display/download it.
     * URL: GET /api/attachments/files/{filename}
     */
    @GetMapping("/files/{filename:.+}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Download / view a stored file")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = "application/octet-stream";
            try {
                contentType = java.nio.file.Files.probeContentType(filePath);
                if (contentType == null) contentType = "application/octet-stream";
            } catch (Exception ignored) {}

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

