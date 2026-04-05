package com.example.projectflow.dto.task;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TaskAssigneeRequest {

    @NotEmpty(message = "At least one user ID is required")
    private List<Long> userIds;
}
