package com.blog.blogservice.security;

/**
 * Defines all permissions in the system
 * Format: RESOURCE_ACTION_SCOPE
 */
public enum Permission {
    // Blog permissions
    BLOG_CREATE("BLOG", "CREATE", "OWN"),
    BLOG_READ_ALL("BLOG", "READ", "ALL"),
    BLOG_UPDATE_OWN("BLOG", "UPDATE", "OWN"),
    BLOG_UPDATE_ALL("BLOG", "UPDATE", "ALL"),
    BLOG_DELETE_OWN("BLOG", "DELETE", "OWN"),
    BLOG_DELETE_ALL("BLOG", "DELETE", "ALL"),

    // Comment permissions
    COMMENT_CREATE("COMMENT", "CREATE", "OWN"),
    COMMENT_READ_ALL("COMMENT", "READ", "ALL"),
    COMMENT_UPDATE_OWN("COMMENT", "UPDATE", "OWN"),
    COMMENT_UPDATE_ALL("COMMENT", "UPDATE", "ALL"),
    COMMENT_DELETE_OWN("COMMENT", "DELETE", "OWN"),
    COMMENT_DELETE_ALL("COMMENT", "DELETE", "ALL");

    private final String resource;
    private final String action;
    private final String scope;

    Permission(String resource, String action, String scope) {
        this.resource = resource;
        this.action = action;
        this.scope = scope;
    }

    public String getResource() {
        return resource;
    }

    public String getAction() {
        return action;
    }

    public String getScope() {
        return scope;
    }

    public boolean isOwnScope() {
        return "OWN".equals(scope);
    }

    public boolean isAllScope() {
        return "ALL".equals(scope);
    }
}
