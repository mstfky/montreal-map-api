package com.teksi.montrealmap.health;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class DbHealthController {

    private final JdbcTemplate jdbcTemplate;

    public DbHealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health/db")
    public Map<String, Object> db() {
        Integer one = jdbcTemplate.queryForObject("select 1", Integer.class);
        return Map.of("db", "UP", "select1", one);
    }
}
