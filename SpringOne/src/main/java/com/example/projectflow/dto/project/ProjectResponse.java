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
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String ownerName;
    private Long ownerId;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private long memberCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
