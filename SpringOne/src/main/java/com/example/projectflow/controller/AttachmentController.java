package com.example.projectflow.controller;

import com.example.projectflow.dto.ApiResponse;
import com.example.projectflow.dto.attachment.AttachmentResponse;
import com.example.projectflow.service.AttachmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
@Tag(name = "Attachments", description = "Endpoints for managing file attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

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
}
