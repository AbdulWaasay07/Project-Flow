package com.example.projectflow.service.impl;

import com.example.projectflow.dto.attachment.AttachmentResponse;
import com.example.projectflow.entity.*;
import com.example.projectflow.exception.CustomException;
import com.example.projectflow.repository.*;
import com.example.projectflow.service.ActivityLogService;
import com.example.projectflow.service.AttachmentService;
import com.example.projectflow.util.AppConstants;
import com.example.projectflow.util.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final FileStorageUtil fileStorageUtil;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public AttachmentResponse uploadFile(MultipartFile file, Long projectId, Long taskId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Project project = null;
        if (projectId != null) {
            project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
        }

        Task task = null;
        if (taskId != null) {
            task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
            if (project == null) {
                project = task.getProject();
            }
        }

        if (project == null && task == null) {
            throw new CustomException("Either Project ID or Task ID must be provided", HttpStatus.BAD_REQUEST);
        }

        String fileName = fileStorageUtil.storeFile(file);
        
        Attachment attachment = Attachment.builder()
                .filename(file.getOriginalFilename())
                .fileUrl(fileName)
                .fileType(file.getContentType())
                .project(project)
                .task(task)
                .uploadedBy(user)
                .build();

        Attachment saved = attachmentRepository.save(attachment);
        
        activityLogService.log(user, project, task, AppConstants.ACTION_UPLOAD, "Uploaded file: " + file.getOriginalFilename());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteFile(Long attachmentId, String userEmail) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CustomException("Attachment not found", HttpStatus.NOT_FOUND));
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        // Only uploader or Admin can delete
        if (!attachment.getUploadedBy().getEmail().equals(userEmail) && !user.getRole().getName().equals(AppConstants.ROLE_ADMIN)) {
            throw new CustomException("You don't have permission to delete this attachment", HttpStatus.FORBIDDEN);
        }

        fileStorageUtil.deleteFile(attachment.getFileUrl());
        attachmentRepository.delete(attachment);
    }

    @Override
    public List<AttachmentResponse> getProjectAttachments(Long projectId) {
        return attachmentRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AttachmentResponse> getTaskAttachments(Long taskId) {
        return attachmentRepository.findByTaskId(taskId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AttachmentResponse mapToResponse(Attachment attachment) {
        return AttachmentResponse.builder()
                .id(attachment.getId())
                .filename(attachment.getFilename())
                .fileUrl(attachment.getFileUrl())
                .fileType(attachment.getFileType())
                .projectId(attachment.getProject() != null ? attachment.getProject().getId() : null)
                .taskId(attachment.getTask() != null ? attachment.getTask().getId() : null)
                .uploaderName(attachment.getUploadedBy().getFullName())
                .uploadedAt(attachment.getUploadedAt())
                .build();
    }
}
