package com.example.projectflow.dto.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectSummaryResponse {
    private Long id;
    private String name;
    private String description;
    private String status;
    private String ownerName;
    private String managerName;
    private long memberCount;
    private LocalDateTime endDate;
}
