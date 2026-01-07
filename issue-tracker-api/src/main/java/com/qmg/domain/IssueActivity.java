package com.qmg.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "issue_activities")
public class IssueActivity extends PanacheEntityBase {

    @Id
    public UUID id;

    @ManyToOne
    public Issue issue;

    @Column(nullable = false)
    public UUID userId;

    @Column(nullable = false)
    public String action;

    public String field;
    public String oldValue;
    public String newValue;

    public Instant createdAt;

    public static java.util.List<IssueActivity> findByIssueId(UUID issueId) {
        return find("issue.id = ?1 ORDER BY createdAt DESC", issueId).list();
    }
}
