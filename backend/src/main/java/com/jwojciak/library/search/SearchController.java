package com.jwojciak.library.search;

import java.util.List;

import com.jwojciak.library.search.SearchDtos.Recommendations;
import com.jwojciak.library.search.SearchDtos.ScoredBook;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/books")
@Tag(name = "Search and recommendations")
public class SearchController {

    private final SearchService service;

    public SearchController(SearchService service) {
        this.service = service;
    }

    @GetMapping("/search")
    @Operation(summary = "Semantic search: books closest in meaning to a free-text query (English or Polish)")
    public List<ScoredBook> search(@RequestParam @NotBlank @Size(max = 500) String q,
                                   @RequestParam(defaultValue = "12") @Min(1) @Max(50) int limit) {
        return service.semantic(q, limit);
    }

    @GetMapping("/{id}/similar")
    public List<ScoredBook> similar(@PathVariable long id,
                                    @RequestParam(defaultValue = "6") @Min(1) @Max(50) int limit) {
        return service.similar(id, limit);
    }

    @GetMapping("/recommended")
    @Operation(summary = "Books for the signed-in reader, based on their loans and reviews")
    public Recommendations recommended(Authentication auth,
                                       @RequestParam(defaultValue = "8") @Min(1) @Max(50) int limit) {
        return service.recommended(auth.getName(), limit);
    }
}
