package com.qmg.api;

import com.qmg.domain.Issue;
import com.qmg.domain.IssueStatus;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.Instant;
import java.util.List;

@Path("/issues")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class IssueResource {

    @GET
    public List<Issue> list(
            @QueryParam("projectId") Long projectId,
            @QueryParam("status") IssueStatus status
    ) {
        if (projectId != null && status != null) {
            return Issue.list("projectId = ?1 and status = ?2", projectId, status);
        }
        if (projectId != null) {
            return Issue.list("projectId", projectId);
        }
        if (status != null) {
            return Issue.list("status", status);
        }
        return Issue.listAll();
    }

    @GET
    @Path("/{id}")
    public Issue get(@PathParam("id") Long id) {
        return Issue.findById(id);
    }

    @POST
    @Transactional
    public Issue create(Issue issue) {
        issue.createdAt = Instant.now();
        issue.updatedAt = Instant.now();
        issue.persist();
        return issue;
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Issue update(@PathParam("id") Long id, Issue updated) {
        Issue issue = Issue.findById(id);
        if (issue == null) {
            throw new NotFoundException();
        }

        issue.title = updated.title;
        issue.description = updated.description;
        issue.status = updated.status;
        issue.priority = updated.priority;
        issue.assigneeId = updated.assigneeId;
        issue.tags = updated.tags;
        issue.updatedAt = Instant.now();

        return issue;
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") Long id) {
        Issue.deleteById(id);
    }
}
