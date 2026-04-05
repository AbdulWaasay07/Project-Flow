package com.example.projectflow.dto.task;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private Long projectId;
    private String projectName;
    private String status;
    private String priority;
    private LocalDateTime dueDate;
    private List<String> assigneeNames;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
