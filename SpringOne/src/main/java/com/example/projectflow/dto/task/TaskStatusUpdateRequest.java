package com.example.projectflow.dto.task;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TaskStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status; // TODO, IN_PROGRESS, REVIEW, DONE
}
