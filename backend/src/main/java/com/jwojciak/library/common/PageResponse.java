package com.jwojciak.library.common;

import java.util.List;

import org.springframework.data.domain.Page;

/** A stable JSON shape for paged results, independent of Spring Data's internal Page serialisation. */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> of(Page<?> page, List<T> content) {
        return new PageResponse<>(content, page.getNumber(), page.getSize(), page.getTotalElements(),
                page.getTotalPages());
    }
}
