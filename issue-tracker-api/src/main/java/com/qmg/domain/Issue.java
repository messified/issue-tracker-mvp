package com.qmg.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
public class Issue extends PanacheEntityBase {

    @Id
    public UUID id;

    @ManyToOne
    public Project project;

    @Column(nullable = false)
    public String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public IssueStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public Priority priority;

    public UUID assigneeId;
    public UUID reporterId;

    @ElementCollection
    public List<String> tags = new ArrayList<>();

    @Version
    public Long version;

    public Instant createdAt;
    public Instant updatedAt;
}