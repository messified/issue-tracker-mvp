package com.qmg.api;

import com.qmg.domain.Issue;
import com.qmg.domain.IssueComment;
import com.qmg.domain.Project;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class WebSocketService {

    public void broadcastIssueCreated(Issue issue) {
        WebSocketEndpoint endpoint = WebSocketEndpoint.getInstance();
        if (endpoint != null) {
            endpoint.broadcastIssueCreated(issue);
        }
    }

    public void broadcastIssueUpdated(Issue issue) {
        WebSocketEndpoint endpoint = WebSocketEndpoint.getInstance();
        if (endpoint != null) {
            endpoint.broadcastIssueUpdated(issue);
        }
    }

    public void broadcastIssueDeleted(UUID issueId, UUID projectId) {
        WebSocketEndpoint endpoint = WebSocketEndpoint.getInstance();
        if (endpoint != null) {
            endpoint.broadcastIssueDeleted(issueId, projectId);
        }
    }

    public void broadcastCommentAdded(IssueComment comment) {
        WebSocketEndpoint endpoint = WebSocketEndpoint.getInstance();
        if (endpoint != null) {
            endpoint.broadcastCommentAdded(comment);
        }
    }

    public void broadcastCommentUpdated(IssueComment comment) {
        WebSocketEndpoint endpoint = WebSocketEndpoint.getInstance();
        if (endpoint != null) {
            endpoint.broadcastCommentUpdated(comment);
        }
    }

    public void broadcastProjectCreated(Project project) {
        WebSocketEndpoint endpoint = WebSocketEndpoint.getInstance();
        if (endpoint != null) {
            endpoint.broadcastProjectCreated(project);
        }
    }

    public void broadcastProjectUpdated(Project project) {
        WebSocketEndpoint endpoint = WebSocketEndpoint.getInstance();
        if (endpoint != null) {
            endpoint.broadcastProjectUpdated(project);
        }
    }
}
