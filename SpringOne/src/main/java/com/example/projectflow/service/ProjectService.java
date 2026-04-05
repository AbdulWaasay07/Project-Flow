package com.example.projectflow.service;

import com.example.projectflow.dto.project.*;

import java.util.List;

public interface ProjectService {
    ProjectResponse createProject(ProjectCreateRequest request, String ownerEmail);
    ProjectResponse updateProject(Long id, ProjectUpdateRequest request, String userEmail);
    void deleteProject(Long id, String userEmail);
    ProjectResponse getProjectById(Long id);
    List<ProjectSummaryResponse> getAllProjects(String userEmail);
    void assignManager(Long projectId, Long userId, String adminEmail);
    void addMember(Long projectId, Long userId, String managerEmail);
    void removeMember(Long projectId, Long userId, String managerEmail);
}
