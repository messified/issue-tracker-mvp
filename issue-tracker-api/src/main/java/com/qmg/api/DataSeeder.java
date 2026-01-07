package com.qmg.api;

import com.qmg.domain.*;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class DataSeeder {

    @Transactional
    void onStart(@Observes StartupEvent ev) {
        // Only seed if database is empty
        if (User.count() > 0) {
            return;
        }

        // Create demo users
        User admin = createUser("admin@example.com", "Admin User", "admin123");
        User developer = createUser("dev@example.com", "Developer", "dev123");
        User tester = createUser("tester@example.com", "Tester", "test123");

        // Create demo projects
        Project project1 = createProject("Web Application", "Main web application project", admin.id);
        Project project2 = createProject("Mobile App", "Mobile application development", admin.id);

        // Add members to projects
        addProjectMember(project1, developer.id, UserRole.MAINTAINER);
        addProjectMember(project1, tester.id, UserRole.REPORTER);
        addProjectMember(project2, developer.id, UserRole.MAINTAINER);

        // Create demo issues
        createIssue(project1, "Fix login bug", "Users cannot log in with special characters", 
                admin.id, developer.id, IssueStatus.IN_PROGRESS, Priority.HIGH, 
                Arrays.asList("bug", "critical"));
        
        createIssue(project1, "Add dark mode", "Implement dark theme for the application", 
                admin.id, developer.id, IssueStatus.OPEN, Priority.MEDIUM, 
                Arrays.asList("feature", "ui"));
        
        createIssue(project1, "Update dependencies", "Update all npm packages to latest versions", 
                admin.id, null, IssueStatus.OPEN, Priority.LOW, 
                Arrays.asList("maintenance"));
        
        createIssue(project2, "Performance optimization", "Improve app startup time", 
                admin.id, developer.id, IssueStatus.OPEN, Priority.MEDIUM, 
                Arrays.asList("performance", "optimization"));
    }

    private User createUser(String email, String name, String password) {
        User user = new User();
        user.id = UUID.randomUUID();
        user.email = email;
        user.name = name;
        user.passwordHash = org.mindrot.jbcrypt.BCrypt.hashpw(password, org.mindrot.jbcrypt.BCrypt.gensalt());
        user.createdAt = Instant.now();
        user.updatedAt = Instant.now();
        user.persist();
        return user;
    }

    private Project createProject(String name, String description, UUID ownerId) {
        Project project = new Project();
        project.id = UUID.randomUUID();
        project.name = name;
        project.description = description;
        project.ownerId = ownerId;
        project.createdAt = Instant.now();
        project.updatedAt = Instant.now();
        project.persist();

        // Add owner as project member
        addProjectMember(project, ownerId, UserRole.OWNER);
        
        return project;
    }

    private void addProjectMember(Project project, UUID userId, UserRole role) {
        ProjectMember member = new ProjectMember();
        member.id = UUID.randomUUID();
        member.project = project;
        member.userId = userId;
        member.role = role;
        member.addedAt = Instant.now();
        member.persist();
    }

    private Issue createIssue(Project project, String title, String description, 
                             UUID reporterId, UUID assigneeId, IssueStatus status, 
                             Priority priority, List<String> tags) {
        Issue issue = new Issue();
        issue.id = UUID.randomUUID();
        issue.project = project;
        issue.title = title;
        issue.description = description;
        issue.reporterId = reporterId;
        issue.assigneeId = assigneeId;
        issue.status = status;
        issue.priority = priority;
        issue.tags = tags;
        issue.createdAt = Instant.now();
        issue.updatedAt = Instant.now();
        issue.persist();

        // Create activity log
        IssueActivity activity = new IssueActivity();
        activity.id = UUID.randomUUID();
        activity.issue = issue;
        activity.userId = reporterId;
        activity.action = "created";
        activity.createdAt = Instant.now();
        activity.persist();

        return issue;
    }
}
