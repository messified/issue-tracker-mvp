package com.qmg.api;

import com.qmg.api.dto.CommentRequest;
import com.qmg.api.dto.CreateIssueRequest;
import com.qmg.api.dto.PaginatedResponse;
import com.qmg.api.dto.UpdateIssueRequest;
import com.qmg.domain.*;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Path("/api/issues")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class IssueResource {

    @jakarta.inject.Inject
    WebSocketService webSocketService;

    @GET
    public PaginatedResponse<Issue> list(
            @QueryParam("projectId") String projectIdParam,
            @QueryParam("status") String statusParam,
            @QueryParam("priority") String priorityParam,
            @QueryParam("assigneeId") String assigneeIdParam,
            @QueryParam("tag") String tag,
            @QueryParam("search") String search,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("pageSize") @DefaultValue("20") int pageSize,
            @QueryParam("sortBy") @DefaultValue("createdAt") String sortBy,
            @QueryParam("sortOrder") @DefaultValue("desc") String sortOrder
    ) {
        // Build query
        List<Object> params = new ArrayList<>();
        List<String> conditions = new ArrayList<>();
        int paramIndex = 1;

        if (projectIdParam != null && !projectIdParam.isEmpty()) {
            try {
                UUID projectId = UUID.fromString(projectIdParam);
                conditions.add("project.id = ?" + paramIndex);
                params.add(projectId);
                paramIndex++;
            } catch (IllegalArgumentException e) {
                // Invalid UUID, ignore
            }
        }

        if (statusParam != null && !statusParam.isEmpty()) {
            String[] statuses = statusParam.split(",");
            if (statuses.length == 1) {
                conditions.add("status = ?" + paramIndex);
                params.add(IssueStatus.valueOf(statuses[0].toUpperCase()));
                paramIndex++;
            } else {
                List<String> placeholders = new ArrayList<>();
                for (String s : statuses) {
                    placeholders.add("?" + paramIndex);
                    params.add(IssueStatus.valueOf(s.toUpperCase()));
                    paramIndex++;
                }
                conditions.add("status IN (" + String.join(",", placeholders) + ")");
            }
        }

        if (priorityParam != null && !priorityParam.isEmpty()) {
            String[] priorities = priorityParam.split(",");
            if (priorities.length == 1) {
                conditions.add("priority = ?" + paramIndex);
                params.add(Priority.valueOf(priorities[0].toUpperCase()));
                paramIndex++;
            } else {
                List<String> placeholders = new ArrayList<>();
                for (String p : priorities) {
                    placeholders.add("?" + paramIndex);
                    params.add(Priority.valueOf(p.toUpperCase()));
                    paramIndex++;
                }
                conditions.add("priority IN (" + String.join(",", placeholders) + ")");
            }
        }

        if (assigneeIdParam != null && !assigneeIdParam.isEmpty()) {
            try {
                UUID assigneeId = UUID.fromString(assigneeIdParam);
                conditions.add("assigneeId = ?" + paramIndex);
                params.add(assigneeId);
                paramIndex++;
            } catch (IllegalArgumentException e) {
                // Invalid UUID, ignore
            }
        }

        if (search != null && !search.isEmpty()) {
            conditions.add("LOWER(title) LIKE ?" + paramIndex);
            params.add("%" + search.toLowerCase() + "%");
            paramIndex++;
        }

        String query = conditions.isEmpty() ? "" : String.join(" AND ", conditions);
        
        // Handle tag filtering (requires join with tags collection)
        io.quarkus.panache.common.Page panachePage = Page.of(page - 1, pageSize);
        Sort sort = Sort.by(sortBy).direction(sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.Ascending : Sort.Direction.Descending);

        List<Issue> issues;
        long total;

        if (tag != null && !tag.isEmpty()) {
            // For tag filtering, we need to filter in memory or use a more complex query
            if (query.isEmpty()) {
                issues = Issue.findAll(sort).page(panachePage).list();
            } else {
                issues = Issue.find(query, sort, params.toArray()).page(panachePage).list();
            }
            // Filter by tag
            issues = issues.stream()
                    .filter(issue -> issue.tags != null && issue.tags.contains(tag))
                    .collect(Collectors.toList());
            total = issues.size(); // Approximate for tag filtering
        } else {
            if (query.isEmpty()) {
                issues = Issue.findAll(sort).page(panachePage).list();
                total = Issue.count();
            } else {
                issues = Issue.find(query, sort, params.toArray()).page(panachePage).list();
                total = Issue.count(query, params.toArray());
            }
        }

        return new PaginatedResponse<>(issues, total, page, pageSize);
    }

    @GET
    @Path("/{id}")
    public Issue get(@PathParam("id") String idParam) {
        UUID id = UUID.fromString(idParam);
        Issue issue = Issue.findById(id);
        if (issue == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }
        return issue;
    }

    @POST
    @Transactional
    public Issue create(CreateIssueRequest request) {
        if (request.projectId == null) {
            throw new jakarta.ws.rs.BadRequestException("Project is required");
        }
        
        // Load the project entity
        Project project = Project.findById(request.projectId);
        if (project == null) {
            throw new jakarta.ws.rs.BadRequestException("Project not found");
        }
        
        Issue issue = new Issue();
        issue.id = UUID.randomUUID();
        issue.project = project;
        issue.title = request.title;
        issue.description = request.description;
        issue.priority = request.priority;
        issue.status = IssueStatus.OPEN; // Default status
        issue.assigneeId = request.assigneeId;
        issue.tags = request.tags != null ? request.tags : new ArrayList<>();
        issue.reporterId = UUID.fromString("00000000-0000-0000-0000-000000000001"); // TODO: Get from auth context
        issue.createdAt = Instant.now();
        issue.updatedAt = Instant.now();
        issue.persist();

        // Create activity log entry
        createActivity(issue.id, issue.reporterId, "created", null, null, null);

        // Broadcast WebSocket event
        if (webSocketService != null) {
            webSocketService.broadcastIssueCreated(issue);
        }

        return issue;
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") String idParam, UpdateIssueRequest request) {
        UUID id = UUID.fromString(idParam);
        Issue issue = Issue.findById(id);
        if (issue == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }

        // Optimistic locking check
        if (request.version != null && !request.version.equals(issue.version)) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("{\"error\":\"Version mismatch\"}")
                    .build();
        }

        // Track changes for activity log
        UUID userId = issue.reporterId; // TODO: Get from auth context

        if (request.title != null && !request.title.equals(issue.title)) {
            createActivity(id, userId, "updated", "title", issue.title, request.title);
            issue.title = request.title;
        }
        if (request.description != null && !request.description.equals(issue.description)) {
            createActivity(id, userId, "updated", "description", null, null);
            issue.description = request.description;
        }
        if (request.status != null && !request.status.equals(issue.status)) {
            createActivity(id, userId, "status_changed", "status", issue.status.name(), request.status.name());
            issue.status = request.status;
        }
        if (request.priority != null && !request.priority.equals(issue.priority)) {
            createActivity(id, userId, "updated", "priority", issue.priority.name(), request.priority.name());
            issue.priority = request.priority;
        }
        if (request.assigneeId != null && !request.assigneeId.equals(issue.assigneeId)) {
            createActivity(id, userId, "assigned", "assigneeId", 
                    issue.assigneeId != null ? issue.assigneeId.toString() : null,
                    request.assigneeId.toString());
            issue.assigneeId = request.assigneeId;
        }
        if (request.tags != null) {
            issue.tags = request.tags;
        }

        issue.updatedAt = Instant.now();
        
        // Broadcast WebSocket event
        if (webSocketService != null) {
            webSocketService.broadcastIssueUpdated(issue);
        }
        
        return Response.ok(issue).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") String idParam) {
        UUID id = UUID.fromString(idParam);
        Issue issue = Issue.findById(id);
        if (issue != null) {
            UUID projectId = issue.project.id;
            Issue.deleteById(id);
            
            // Broadcast WebSocket event
            if (webSocketService != null) {
                webSocketService.broadcastIssueDeleted(id, projectId);
            }
        }
    }

    // Comments endpoints
    @GET
    @Path("/{id}/comments")
    public List<IssueComment> getComments(@PathParam("id") String idParam) {
        UUID id = UUID.fromString(idParam);
        return IssueComment.findByIssueId(id);
    }

    @POST
    @Path("/{id}/comments")
    @Transactional
    public IssueComment addComment(@PathParam("id") String idParam, CommentRequest request) {
        UUID id = UUID.fromString(idParam);
        Issue issue = Issue.findById(id);
        if (issue == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }

        IssueComment comment = new IssueComment();
        comment.id = UUID.randomUUID();
        comment.issue = issue;
        comment.userId = UUID.fromString("00000000-0000-0000-0000-000000000001"); // TODO: Get from auth context
        comment.content = request.content;
        comment.createdAt = Instant.now();
        comment.updatedAt = Instant.now();
        comment.persist();

        createActivity(id, comment.userId, "commented", null, null, null);

        // Broadcast WebSocket event
        if (webSocketService != null) {
            webSocketService.broadcastCommentAdded(comment);
        }

        return comment;
    }

    @PUT
    @Path("/{id}/comments/{commentId}")
    @Transactional
    public IssueComment updateComment(
            @PathParam("id") String idParam,
            @PathParam("commentId") String commentIdParam,
            CommentRequest request
    ) {
        UUID id = UUID.fromString(idParam);
        UUID commentId = UUID.fromString(commentIdParam);
        IssueComment comment = IssueComment.findById(commentId);
        if (comment == null || !comment.issue.id.equals(id)) {
            throw new jakarta.ws.rs.NotFoundException();
        }

        comment.content = request.content;
        comment.updatedAt = Instant.now();
        
        // Broadcast WebSocket event
        if (webSocketService != null) {
            webSocketService.broadcastCommentUpdated(comment);
        }
        
        return comment;
    }

    @DELETE
    @Path("/{id}/comments/{commentId}")
    @Transactional
    public void deleteComment(@PathParam("id") String idParam, @PathParam("commentId") String commentIdParam) {
        UUID id = UUID.fromString(idParam);
        UUID commentId = UUID.fromString(commentIdParam);
        IssueComment comment = IssueComment.findById(commentId);
        if (comment == null || !comment.issue.id.equals(id)) {
            throw new jakarta.ws.rs.NotFoundException();
        }
        IssueComment.deleteById(commentId);
    }

    // Activity log endpoint
    @GET
    @Path("/{id}/activity")
    public List<IssueActivity> getActivity(@PathParam("id") String idParam) {
        UUID id = UUID.fromString(idParam);
        return IssueActivity.findByIssueId(id);
    }

    // Tag management endpoints
    @POST
    @Path("/{id}/tags")
    @Transactional
    public Response addTags(@PathParam("id") String idParam, com.qmg.api.dto.AddTagsRequest request) {
        UUID id = UUID.fromString(idParam);
        Issue issue = Issue.findById(id);
        if (issue == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }

        if (request.version != null && !request.version.equals(issue.version)) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("{\"error\":\"Version mismatch\"}")
                    .build();
        }

        if (issue.tags == null) {
            issue.tags = new ArrayList<>();
        }
        for (String tag : request.tags) {
            if (!issue.tags.contains(tag)) {
                issue.tags.add(tag);
            }
        }
        issue.updatedAt = Instant.now();

        return Response.ok(issue).build();
    }

    @DELETE
    @Path("/{id}/tags/{tag}")
    @Transactional
    public Response removeTag(@PathParam("id") String idParam, @PathParam("tag") String tag) {
        UUID id = UUID.fromString(idParam);
        Issue issue = Issue.findById(id);
        if (issue == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }

        if (issue.tags != null) {
            issue.tags.remove(tag);
        }
        issue.updatedAt = Instant.now();

        return Response.ok(issue).build();
    }

    // Helper method to create activity log entries
    private void createActivity(UUID issueId, UUID userId, String action, String field, String oldValue, String newValue) {
        Issue issue = Issue.findById(issueId);
        if (issue == null) return;

        IssueActivity activity = new IssueActivity();
        activity.id = UUID.randomUUID();
        activity.issue = issue;
        activity.userId = userId != null ? userId : UUID.fromString("00000000-0000-0000-0000-000000000001"); // TODO: Get from auth context
        activity.action = action;
        activity.field = field;
        activity.oldValue = oldValue;
        activity.newValue = newValue;
        activity.createdAt = Instant.now();
        activity.persist();
    }
}
