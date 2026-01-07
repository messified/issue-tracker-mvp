package com.qmg.api;

import com.qmg.domain.Issue;
import com.qmg.domain.IssueComment;
import com.qmg.domain.Project;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/ws")
@ApplicationScoped
public class WebSocketEndpoint {

    private final Map<String, Session> sessions = new ConcurrentHashMap<>();
    
    // Static reference for broadcasting (CDI injection doesn't work with @ServerEndpoint)
    private static WebSocketEndpoint instance;
    
    public WebSocketEndpoint() {
        instance = this;
    }
    
    public static WebSocketEndpoint getInstance() {
        return instance;
    }

    @OnOpen
    public void onOpen(Session session) {
        // TODO: Extract and validate token from query parameter
        // For MVP, we'll accept any connection for now
        
        String sessionId = session.getId();
        sessions.put(sessionId, session);
        
        try {
            sendMessage(session, createMessage("CONNECTED", Map.of("message", "Connected to WebSocket")));
        } catch (IOException e) {
            System.err.println("Error sending connection message: " + e.getMessage());
        }
    }

    @OnClose
    public void onClose(Session session) {
        sessions.remove(session.getId());
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        System.err.println("WebSocket error for session " + session.getId() + ": " + throwable.getMessage());
        sessions.remove(session.getId());
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        // Handle incoming messages (e.g., PING for heartbeat)
        try {
            if (message.equals("PING")) {
                sendMessage(session, createMessage("PONG", Map.of()));
            }
        } catch (IOException e) {
            System.err.println("Error handling message: " + e.getMessage());
        }
    }

    /**
     * Broadcast issue created event
     */
    public void broadcastIssueCreated(Issue issue) {
        broadcast(createMessage("ISSUE_CREATED", Map.of(
            "id", issue.id.toString(),
            "projectId", issue.project.id.toString(),
            "title", issue.title,
            "status", issue.status.toString(),
            "priority", issue.priority.toString()
        )));
    }

    /**
     * Broadcast issue updated event
     */
    public void broadcastIssueUpdated(Issue issue) {
        broadcast(createMessage("ISSUE_UPDATED", Map.of(
            "id", issue.id.toString(),
            "projectId", issue.project.id.toString(),
            "title", issue.title,
            "status", issue.status.toString(),
            "priority", issue.priority.toString()
        )));
    }

    /**
     * Broadcast issue deleted event
     */
    public void broadcastIssueDeleted(UUID issueId, UUID projectId) {
        broadcast(createMessage("ISSUE_DELETED", Map.of(
            "id", issueId.toString(),
            "projectId", projectId.toString()
        )));
    }

    /**
     * Broadcast comment added event
     */
    public void broadcastCommentAdded(IssueComment comment) {
        broadcast(createMessage("COMMENT_ADDED", Map.of(
            "id", comment.id.toString(),
            "issueId", comment.issue.id.toString(),
            "content", comment.content,
            "userId", comment.userId.toString()
        )));
    }

    /**
     * Broadcast comment updated event
     */
    public void broadcastCommentUpdated(IssueComment comment) {
        broadcast(createMessage("COMMENT_UPDATED", Map.of(
            "id", comment.id.toString(),
            "issueId", comment.issue.id.toString(),
            "content", comment.content
        )));
    }

    /**
     * Broadcast project created event
     */
    public void broadcastProjectCreated(Project project) {
        broadcast(createMessage("PROJECT_CREATED", Map.of(
            "id", project.id.toString(),
            "name", project.name
        )));
    }

    /**
     * Broadcast project updated event
     */
    public void broadcastProjectUpdated(Project project) {
        broadcast(createMessage("PROJECT_UPDATED", Map.of(
            "id", project.id.toString(),
            "name", project.name
        )));
    }

    /**
     * Broadcast to all connected sessions
     */
    private void broadcast(String message) {
        sessions.values().forEach(session -> {
            try {
                sendMessage(session, message);
            } catch (IOException e) {
                System.err.println("Error broadcasting to session " + session.getId() + ": " + e.getMessage());
            }
        });
    }

    /**
     * Send message to a specific session
     */
    private void sendMessage(Session session, String message) throws IOException {
        if (session.isOpen()) {
            session.getBasicRemote().sendText(message);
        }
    }

    /**
     * Create a JSON message
     */
    private String createMessage(String type, Map<String, Object> payload) {
        return String.format(
            "{\"type\":\"%s\",\"payload\":%s,\"timestamp\":\"%s\"}",
            type,
            mapToJson(payload),
            java.time.Instant.now().toString()
        );
    }

    /**
     * Convert map to JSON string (simple implementation)
     */
    private String mapToJson(Map<String, Object> map) {
        StringBuilder json = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) {
                json.append(",");
            }
            json.append("\"").append(entry.getKey()).append("\":");
            Object value = entry.getValue();
            if (value instanceof String) {
                json.append("\"").append(escapeJson((String) value)).append("\"");
            } else {
                json.append(value);
            }
            first = false;
        }
        json.append("}");
        return json.toString();
    }

    private String escapeJson(String str) {
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }
}
