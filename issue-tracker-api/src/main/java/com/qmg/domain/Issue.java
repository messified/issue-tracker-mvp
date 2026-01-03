package com.qmg.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.Instant;
import java.util.List;

@Entity
public class Issue extends PanacheEntity {

    public Long projectId;

    public String title;
    public String description;

    @Enumerated(EnumType.STRING)
    public IssueStatus status;

    public Integer priority;
    public Long assigneeId;

    @ElementCollection
    public List<String> tags;

    public Instant createdAt;
    public Instant updatedAt;
}