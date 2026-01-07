package com.qmg.api.dto;

import java.util.List;

public class PaginatedResponse<T> {
    public List<T> data;
    public long total;
    public int page;
    public int pageSize;
    public int totalPages;

    public PaginatedResponse(List<T> data, long total, int page, int pageSize) {
        this.data = data;
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
        this.totalPages = (int) Math.ceil((double) total / pageSize);
    }
}
