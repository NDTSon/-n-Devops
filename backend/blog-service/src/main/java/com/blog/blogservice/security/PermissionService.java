package com.blog.blogservice.security;

import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service to check user permissions based on their role
 * This provides dynamic RBAC without database changes
 */
@Service
public class PermissionService {

    // Role -> Permissions mapping
    private static final Map<String, Set<Permission>> ROLE_PERMISSIONS = new HashMap<>();

    static {
        // GUEST permissions
        Set<Permission> guestPermissions = new HashSet<>();
        guestPermissions.add(Permission.BLOG_READ_ALL);
        guestPermissions.add(Permission.COMMENT_READ_ALL);
        ROLE_PERMISSIONS.put("GUEST", guestPermissions);

        // USER permissions
        Set<Permission> userPermissions = new HashSet<>(guestPermissions);
        userPermissions.add(Permission.COMMENT_CREATE);
        userPermissions.add(Permission.COMMENT_UPDATE_OWN);
        ROLE_PERMISSIONS.put("USER", userPermissions);

        // EDITOR permissions
        Set<Permission> editorPermissions = new HashSet<>(userPermissions);
        editorPermissions.add(Permission.BLOG_CREATE);
        editorPermissions.add(Permission.BLOG_UPDATE_OWN);
        editorPermissions.add(Permission.BLOG_DELETE_OWN);
        ROLE_PERMISSIONS.put("EDITOR", editorPermissions);

        // ADMIN permissions (all permissions)
        Set<Permission> adminPermissions = new HashSet<>(editorPermissions);
        adminPermissions.add(Permission.BLOG_UPDATE_ALL);
        adminPermissions.add(Permission.BLOG_DELETE_ALL);
        adminPermissions.add(Permission.COMMENT_UPDATE_ALL);
        adminPermissions.add(Permission.COMMENT_DELETE_ALL);
        ROLE_PERMISSIONS.put("ADMIN", adminPermissions);
    }

    /**
     * Check if user has permission
     * 
     * @param role       User's role
     * @param permission Permission to check
     * @return true if user has permission
     */
    public boolean hasPermission(String role, Permission permission) {
        if (role == null) {
            return false;
        }

        Set<Permission> permissions = ROLE_PERMISSIONS.get(role.toUpperCase());
        return permissions != null && permissions.contains(permission);
    }

    /**
     * Check if user can perform action on resource
     * Handles ownership logic for OWN scope permissions
     * 
     * @param role            User's role
     * @param permission      Permission to check
     * @param userId          Current user ID
     * @param resourceOwnerId Owner ID of the resource
     * @return true if user has permission
     */
    public boolean canAccess(String role, Permission permission, UUID userId, UUID resourceOwnerId) {
        // First check if user has the "ALL" version of this permission (e.g. ADMIN)
        Permission allScopePermission = getAllScopeVersion(permission);
        if (allScopePermission != null && hasPermission(role, allScopePermission)) {
            return true; // User has ALL scope permission, can access everything
        }

        // Then check if user has the exact permission
        if (!hasPermission(role, permission)) {
            return false; // User doesn't have the permission at all
        }

        // If permission is OWN scope, check ownership
        if (permission.isOwnScope()) {
            return userId != null && userId.equals(resourceOwnerId);
        }

        return true;
    }

    /**
     * Get the ALL scope version of a permission
     * For example: BLOG_UPDATE_OWN -> BLOG_UPDATE_ALL
     */
    private Permission getAllScopeVersion(Permission permission) {
        if (permission.isAllScope()) {
            return permission;
        }

        try {
            String allPermissionName = permission.name().replace("_OWN", "_ALL");
            return Permission.valueOf(allPermissionName);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Get all permissions for a role
     */
    public Set<Permission> getPermissions(String role) {
        if (role == null) {
            return Collections.emptySet();
        }
        return ROLE_PERMISSIONS.getOrDefault(role.toUpperCase(), Collections.emptySet());
    }
}
