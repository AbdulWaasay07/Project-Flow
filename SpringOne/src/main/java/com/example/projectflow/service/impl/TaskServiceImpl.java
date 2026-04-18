package com.example.projectflow.service.impl;

import com.example.projectflow.dto.task.*;
import com.example.projectflow.entity.*;
import com.example.projectflow.exception.CustomException;
import com.example.projectflow.repository.*;
import com.example.projectflow.service.ActivityLogService;
import com.example.projectflow.service.NotificationService;
import com.example.projectflow.service.TaskService;
import com.example.projectflow.service.TaskStatusHistoryService;
import com.example.projectflow.util.AppConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;
    private final TaskStatusHistoryService taskStatusHistoryService;

    @Override
    @Transactional
    public TaskResponse createTask(TaskCreateRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .project(project)
                .priority(request.getPriority() != null ? request.getPriority() : AppConstants.TASK_PRIORITY_MEDIUM)
                .dueDate(request.getDueDate())
                .build();

        Task saved = taskRepository.save(task);

        // Assign users if provided
        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            for (Long assigneeId : request.getAssigneeIds()) {
                User assignee = findUserById(assigneeId);
                TaskAssignee ta = TaskAssignee.builder().task(saved).user(assignee).build();
                taskAssigneeRepository.save(ta);
                notificationService.sendNotification(assignee, "Task Assigned",
                        "You have been assigned to task: " + saved.getTitle());
            }
        }

        activityLogService.log(user, saved, AppConstants.ACTION_CREATE, "Created task: " + saved.getTitle());
        taskStatusHistoryService.recordStatusChange(saved, null, saved.getStatus(), user);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TaskResponse updateTask(Long id, TaskUpdateRequest request, String userEmail) {
        Task task = findTaskById(id);
        User user = findUserByEmail(userEmail);

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());

        Task updated = taskRepository.save(task);
        activityLogService.log(user, updated, AppConstants.ACTION_UPDATE, "Updated task: " + updated.getTitle());

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public TaskResponse changeStatus(Long id, TaskStatusUpdateRequest request, String userEmail) {
        Task task = findTaskById(id);
        User user = findUserByEmail(userEmail);

        String oldStatus = task.getStatus();
        task.setStatus(request.getStatus());

        Task updated = taskRepository.save(task);

        taskStatusHistoryService.recordStatusChange(updated, oldStatus, request.getStatus(), user);
        activityLogService.log(user, updated, AppConstants.ACTION_STATUS_CHANGE,
                "Status changed from " + oldStatus + " to " + request.getStatus());

        // Notify assignees
        List<TaskAssignee> assignees = taskAssigneeRepository.findByTaskId(id);
        for (TaskAssignee ta : assignees) {
            if (!ta.getUser().getEmail().equals(userEmail)) {
                notificationService.sendNotification(ta.getUser(), "Task Status Updated",
                        "Task '" + updated.getTitle() + "' status changed to " + request.getStatus());
            }
        }

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteTask(Long id, String userEmail) {
        Task task = findTaskById(id);
        User user = findUserByEmail(userEmail);
        String taskTitle = task.getTitle();
        Project project = task.getProject();

        // Null-out task references in activity logs to avoid FK constraint violation
        // (ActivityLog.task is not a cascade-delete child of Task)
        List<ActivityLog> taskLogs = activityLogRepository.findByTaskIdOrderByCreatedAtDesc(id, org.springframework.data.domain.Pageable.unpaged()).getContent();
        for (ActivityLog log : taskLogs) {
            log.setTask(null);
        }
        activityLogRepository.saveAll(taskLogs);

        // Log the deletion AFTER nulling refs, using project directly
        activityLogService.log(user, project, AppConstants.ACTION_DELETE, "Deleted task: " + taskTitle);

        taskRepository.delete(task);
    }

    @Override
    public TaskResponse getTaskById(Long id) {
        return mapToResponse(findTaskById(id));
    }

    @Override
    public List<TaskResponse> getTasksByProject(Long projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void assignUsers(Long taskId, TaskAssigneeRequest request, String userEmail) {
        Task task = findTaskById(taskId);
        User assigner = findUserByEmail(userEmail);

        for (Long userId : request.getUserIds()) {
            if (taskAssigneeRepository.existsByTaskIdAndUserId(taskId, userId)) {
                continue; // skip already assigned
            }
            User assignee = findUserById(userId);
            TaskAssignee ta = TaskAssignee.builder().task(task).user(assignee).build();
            taskAssigneeRepository.save(ta);

            notificationService.sendNotification(assignee, "Task Assigned",
                    "You have been assigned to task: " + task.getTitle());
            activityLogService.log(assigner, task, AppConstants.ACTION_ASSIGN,
                    "Assigned " + assignee.getFullName() + " to task");
        }
    }

    @Override
    @Transactional
    public void unassignUser(Long taskId, Long userId, String userEmail) {
        Task task = findTaskById(taskId);
        User assigner = findUserByEmail(userEmail);
        User assignee = findUserById(userId);

        if (!taskAssigneeRepository.existsByTaskIdAndUserId(taskId, userId)) {
            throw new CustomException("User is not assigned to this task", HttpStatus.BAD_REQUEST);
        }

        taskAssigneeRepository.deleteByTaskIdAndUserId(taskId, userId);

        notificationService.sendNotification(assignee, "Task Unassigned",
                "You have been removed from task: " + task.getTitle());
        activityLogService.log(assigner, task, AppConstants.ACTION_UNASSIGN,
                "Unassigned " + assignee.getFullName() + " from task");
    }

    @Override
    public List<TaskResponse> getOverdueTasks() {
        return taskRepository.findByDueDateBeforeAndStatusNot(LocalDateTime.now(), AppConstants.TASK_STATUS_DONE)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // --- Helpers ---

    private Task findTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private TaskResponse mapToResponse(Task task) {
        List<String> assigneeNames = taskAssigneeRepository.findByTaskId(task.getId())
                .stream().map(ta -> ta.getUser().getFullName()).collect(Collectors.toList());

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .assigneeNames(assigneeNames)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
