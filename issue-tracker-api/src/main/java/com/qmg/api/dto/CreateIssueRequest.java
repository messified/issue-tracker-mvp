package com.qmg.api.dto;

import com.qmg.domain.Priority;
import java.util.List;
import java.util.UUID;

public class CreateIssueRequest {
    public UUID projectId;
    public String title;
    public String description;
    public Priority priority;
    public UUID assigneeId;
    public List<String> tags;
}
