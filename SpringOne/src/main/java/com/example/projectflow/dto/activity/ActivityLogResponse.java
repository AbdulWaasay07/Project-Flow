package com.example.projectflow.dto.activity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponse {
    private Long id;
    private String userEmail;
    private String userName;
    private Long projectId;
    private String projectName;
    private Long taskId;
    private String taskTitle;
    private String action;
    private String details;
    private LocalDateTime createdAt;
}
