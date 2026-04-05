package com.example.projectflow.service;

import com.example.projectflow.dto.attachment.AttachmentResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AttachmentService {
    AttachmentResponse uploadFile(MultipartFile file, Long projectId, Long taskId, String userEmail);
    void deleteFile(Long attachmentId, String userEmail);
    List<AttachmentResponse> getProjectAttachments(Long projectId);
    List<AttachmentResponse> getTaskAttachments(Long taskId);
}
