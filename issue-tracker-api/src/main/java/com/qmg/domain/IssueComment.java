package com.qmg.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "issue_comments")
public class IssueComment extends PanacheEntityBase {

    @Id
    public UUID id;

    @ManyToOne
    public Issue issue;

    @Column(nullable = false)
    public UUID userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String content;

    @Version
    public Long version;

    public Instant createdAt;
    public Instant updatedAt;

    public static java.util.List<IssueComment> findByIssueId(UUID issueId) {
        return find("issue.id", issueId).list();
    }
}
