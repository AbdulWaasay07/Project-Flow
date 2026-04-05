package com.example.projectflow.dto.attachment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AttachmentResponse {
    private Long id;
    private String filename;
    private String fileUrl;
    private String fileType;
    private Long taskId;
    private Long projectId;
    private String uploaderName;
    private LocalDateTime uploadedAt;
}
