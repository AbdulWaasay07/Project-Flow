package com.example.projectflow.dto.project;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectCreateRequest {

    @NotBlank(message = "Project name is required")
    private String name;

    private String description;

    private LocalDateTime startDate;

    private LocalDateTime endDate;
}
