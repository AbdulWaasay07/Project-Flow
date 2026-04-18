package com.example.projectflow.dto.project;

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
    private List<MemberDto> members;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MemberDto {
        private Long userId;
        private String fullName;
        private String email;
        private String projectRole;
    }
}
