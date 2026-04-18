package com.example.projectflow.util;

public class AppConstants {
    // Roles (must match the 'name' column in the 'roles' table)
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_MANAGER = "MANAGER";
    public static final String ROLE_TEAM_MEMBER = "TEAM_MEMBER";

    // User status
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_BLOCKED = "BLOCKED";

    // Project status
    public static final String PROJECT_STATUS_PLANNING = "PLANNING";
    public static final String PROJECT_STATUS_ONGOING = "ONGOING";
    public static final String PROJECT_STATUS_COMPLETED = "COMPLETED";
    public static final String PROJECT_STATUS_ON_HOLD = "ON_HOLD";

    // Task status
    public static final String TASK_STATUS_TODO = "TODO";
    public static final String TASK_STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String TASK_STATUS_REVIEW = "REVIEW";
    public static final String TASK_STATUS_DONE = "DONE";

    // Task priority
    public static final String TASK_PRIORITY_LOW = "LOW";
    public static final String TASK_PRIORITY_MEDIUM = "MEDIUM";
    public static final String TASK_PRIORITY_HIGH = "HIGH";
    public static final String TASK_PRIORITY_URGENT = "URGENT";

    // Project member roles
    public static final String PROJECT_ROLE_MANAGER = "MANAGER";
    public static final String PROJECT_ROLE_MEMBER = "TEAM_MEMBER";

    // Activity log actions
    public static final String ACTION_CREATE = "CREATE";
    public static final String ACTION_UPDATE = "UPDATE";
    public static final String ACTION_DELETE = "DELETE";
    public static final String ACTION_STATUS_CHANGE = "STATUS_CHANGE";
    public static final String ACTION_COMMENT = "COMMENT";
    public static final String ACTION_ASSIGN = "ASSIGN";
    public static final String ACTION_UNASSIGN = "UNASSIGN";
    public static final String ACTION_UPLOAD = "UPLOAD";

    private AppConstants() {}
}
