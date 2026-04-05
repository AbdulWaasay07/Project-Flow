package com.example.projectflow.dto.comment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TaskCommentResponse {
    private Long id;
    private String content;
    private Long taskId;
    private String authorName;
    private Long authorId;
    private LocalDateTime createdAt;
}
