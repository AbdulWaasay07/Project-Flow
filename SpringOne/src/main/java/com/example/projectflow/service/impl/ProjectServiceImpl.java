package com.example.projectflow.service.impl;

import com.example.projectflow.dto.project.*;
import com.example.projectflow.entity.ActivityLog;
import com.example.projectflow.entity.Project;
import com.example.projectflow.entity.ProjectMember;
import com.example.projectflow.entity.User;
import com.example.projectflow.exception.CustomException;
import com.example.projectflow.repository.ActivityLogRepository;
import com.example.projectflow.repository.ProjectMemberRepository;
import com.example.projectflow.repository.ProjectRepository;
import com.example.projectflow.repository.UserRepository;
import com.example.projectflow.service.ActivityLogService;
import com.example.projectflow.service.NotificationService;
import com.example.projectflow.service.ProjectService;
import com.example.projectflow.util.AppConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request, String ownerEmail) {
        User owner = findUserByEmail(ownerEmail);

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        Project saved = projectRepository.save(project);

        // Add owner as manager member
        ProjectMember ownerMember = ProjectMember.builder()
                .project(saved)
                .user(owner)
                .role(AppConstants.PROJECT_ROLE_MANAGER)
                .build();
        projectMemberRepository.save(ownerMember);

        activityLogService.log(owner, saved, AppConstants.ACTION_CREATE, "Created project: " + saved.getName());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ProjectResponse updateProject(Long id, ProjectUpdateRequest request, String userEmail) {
        Project project = findProjectById(id);
        User user = findUserByEmail(userEmail);

        if (request.getName() != null) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        if (request.getStartDate() != null) project.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) project.setEndDate(request.getEndDate());

        Project updated = projectRepository.save(project);
        activityLogService.log(user, updated, AppConstants.ACTION_UPDATE, "Updated project: " + updated.getName());

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteProject(Long id, String userEmail) {
        Project project = findProjectById(id);

        // Break references in activity logs to prevent TransientObjectException
        List<ActivityLog> logs = activityLogRepository.findByProjectIdOrderByCreatedAtDesc(id, Pageable.unpaged()).getContent();
        for (ActivityLog log : logs) {
            log.setProject(null);
        }
        activityLogRepository.saveAll(logs);

        // Now safe to delete
        projectRepository.delete(project);
    }

    @Override
    public ProjectResponse getProjectById(Long id) {
        return mapToResponse(findProjectById(id));
    }

    @Override
    public List<ProjectSummaryResponse> getAllProjects(String userEmail) {
        User user = findUserByEmail(userEmail);
        boolean isAdmin = user.getRole().getName().equals(AppConstants.ROLE_ADMIN);

        List<Project> projects;
        if (isAdmin) {
            projects = projectRepository.findAll();
        } else {
            // Get projects where user is owner or member
            List<Long> memberProjectIds = projectMemberRepository.findByUserId(user.getId())
                    .stream().map(pm -> pm.getProject().getId()).collect(Collectors.toList());
            projects = projectRepository.findAllById(memberProjectIds);
        }

        return projects.stream().map(this::mapToSummary).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void assignManager(Long projectId, Long userId, String adminEmail) {
        Project project = findProjectById(projectId);
        User user = findUserById(userId);
        User admin = findUserByEmail(adminEmail);

        // Check if already a member
        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            ProjectMember existing = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                    .orElseThrow();
            existing.setRole(AppConstants.PROJECT_ROLE_MANAGER);
            projectMemberRepository.save(existing);
        } else {
            ProjectMember member = ProjectMember.builder()
                    .project(project)
                    .user(user)
                    .role(AppConstants.PROJECT_ROLE_MANAGER)
                    .build();
            projectMemberRepository.save(member);
        }

        notificationService.sendNotification(user, "Manager Assignment",
                "You have been assigned as manager of project: " + project.getName());
        activityLogService.log(admin, project, AppConstants.ACTION_ASSIGN,
                "Assigned " + user.getFullName() + " as manager");
    }

    @Override
    @Transactional
    public void addMember(Long projectId, Long userId, String managerEmail) {
        Project project = findProjectById(projectId);
        User user = findUserById(userId);
        User manager = findUserByEmail(managerEmail);

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new CustomException("User is already a member of this project", HttpStatus.BAD_REQUEST);
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(user)
                .role(AppConstants.PROJECT_ROLE_MEMBER)
                .build();
        projectMemberRepository.save(member);

        notificationService.sendNotification(user, "Project Assignment",
                "You have been added to project: " + project.getName());
        activityLogService.log(manager, project, AppConstants.ACTION_ASSIGN,
                "Added " + user.getFullName() + " to project");
    }

    @Override
    @Transactional
    public void removeMember(Long projectId, Long userId, String managerEmail) {
        Project project = findProjectById(projectId);
        User user = findUserById(userId);
        User manager = findUserByEmail(managerEmail);

        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new CustomException("User is not a member of this project", HttpStatus.BAD_REQUEST);
        }

        projectMemberRepository.deleteByProjectIdAndUserId(projectId, userId);

        notificationService.sendNotification(user, "Removed from Project",
                "You have been removed from project: " + project.getName());
        activityLogService.log(manager, project, AppConstants.ACTION_UNASSIGN,
                "Removed " + user.getFullName() + " from project");
    }

    // --- Helper methods ---

    private Project findProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .ownerName(project.getOwner().getFullName())
                .ownerId(project.getOwner().getId())
                .status(project.getStatus())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .memberCount(projectMemberRepository.countByProjectId(project.getId()))
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private ProjectSummaryResponse mapToSummary(Project project) {
        return ProjectSummaryResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .status(project.getStatus())
                .ownerName(project.getOwner().getFullName())
                .memberCount(projectMemberRepository.countByProjectId(project.getId()))
                .build();
    }
}
