package com.qmg.api.dto;

import com.qmg.domain.IssueStatus;
import com.qmg.domain.Priority;
import java.util.List;
import java.util.UUID;

public class UpdateIssueRequest {
    public String title;
    public String description;
    public IssueStatus status;
    public Priority priority;
    public UUID assigneeId;
    public List<String> tags;
    public Long version;
}
