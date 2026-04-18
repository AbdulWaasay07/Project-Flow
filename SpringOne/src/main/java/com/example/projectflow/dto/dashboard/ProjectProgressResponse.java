package com.example.projectflow.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectProgressResponse {
    private Long projectId;
    private String projectName;
    private String managerName;
    private String projectStatus;   // "COMPLETED" when all tasks done, else actual status
    private double completionPercentage;
    private long totalTasks;
    private long completedTasks;
}
