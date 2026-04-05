package com.example.projectflow.dto.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectSummaryResponse {
    private Long id;
    private String name;
    private String status;
    private String ownerName;
    private long memberCount;
}
