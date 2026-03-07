import { useAuth } from '../context/AuthContext';
import { useMemo } from 'react';

/**
 * Permission definitions matching backend Permission enum
 */
export const PERMISSIONS = {
    // Blog permissions
    BLOG_CREATE: { resource: 'BLOG', action: 'CREATE', scope: 'OWN' },
    BLOG_READ_ALL: { resource: 'BLOG', action: 'READ', scope: 'ALL' },
    BLOG_UPDATE_OWN: { resource: 'BLOG', action: 'UPDATE', scope: 'OWN' },
    BLOG_UPDATE_ALL: { resource: 'BLOG', action: 'UPDATE', scope: 'ALL' },
    BLOG_DELETE_OWN: { resource: 'BLOG', action: 'DELETE', scope: 'OWN' },
    BLOG_DELETE_ALL: { resource: 'BLOG', action: 'DELETE', scope: 'ALL' },

    // Comment permissions
    COMMENT_CREATE: { resource: 'COMMENT', action: 'CREATE', scope: 'OWN' },
    COMMENT_READ_ALL: { resource: 'COMMENT', action: 'READ', scope: 'ALL' },
    COMMENT_UPDATE_OWN: { resource: 'COMMENT', action: 'UPDATE', scope: 'OWN' },
    COMMENT_UPDATE_ALL: { resource: 'COMMENT', action: 'UPDATE', scope: 'ALL' },
    COMMENT_DELETE_OWN: { resource: 'COMMENT', action: 'DELETE', scope: 'OWN' },
    COMMENT_DELETE_ALL: { resource: 'COMMENT', action: 'DELETE', scope: 'ALL' },
};

/**
 * Role to permissions mapping (matches backend PermissionService)
 */
const ROLE_PERMISSIONS = {
    GUEST: [
        PERMISSIONS.BLOG_READ_ALL,
        PERMISSIONS.COMMENT_READ_ALL,
    ],
    USER: [
        PERMISSIONS.BLOG_READ_ALL,
        PERMISSIONS.COMMENT_READ_ALL,
        PERMISSIONS.COMMENT_CREATE,
        PERMISSIONS.COMMENT_UPDATE_OWN,
    ],
    EDITOR: [
        PERMISSIONS.BLOG_READ_ALL,
        PERMISSIONS.COMMENT_READ_ALL,
        PERMISSIONS.COMMENT_CREATE,
        PERMISSIONS.COMMENT_UPDATE_OWN,
        PERMISSIONS.BLOG_CREATE,
        PERMISSIONS.BLOG_UPDATE_OWN,
        PERMISSIONS.BLOG_DELETE_OWN,
    ],
    ADMIN: [
        PERMISSIONS.BLOG_READ_ALL,
        PERMISSIONS.COMMENT_READ_ALL,
        PERMISSIONS.COMMENT_CREATE,
        PERMISSIONS.COMMENT_UPDATE_OWN,
        PERMISSIONS.BLOG_CREATE,
        PERMISSIONS.BLOG_UPDATE_OWN,
        PERMISSIONS.BLOG_DELETE_OWN,
        PERMISSIONS.BLOG_UPDATE_ALL,
        PERMISSIONS.BLOG_DELETE_ALL,
        PERMISSIONS.COMMENT_UPDATE_ALL,
        PERMISSIONS.COMMENT_DELETE_ALL,
    ],
};

/**
 * Hook to check user permissions
 */
export const usePermission = () => {
    const { user } = useAuth();

    const permissions = useMemo(() => {
        if (!user || !user.role) {
            return ROLE_PERMISSIONS.GUEST;
        }
        return ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.GUEST;
    }, [user]);

    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permission) => {
        return permissions.some(p =>
            p.resource === permission.resource &&
            p.action === permission.action &&
            (p.scope === permission.scope || p.scope === 'ALL')
        );
    };

    /**
     * Check if user can access a resource (with ownership check)
     * @param permission Permission to check
     * @param resourceOwnerId Owner of the resource
     * @returns true if user has access
     */
    const canAccess = (permission, resourceOwnerId) => {
        if (!user) {
            return false;
        }

        // First check if user has the ALL scope version (e.g. ADMIN)
        const allScopePermission = {
            ...permission,
            scope: 'ALL'
        };

        if (hasPermission(allScopePermission)) {
            return true; // ADMIN can access everything
        }

        // Then check if user has the OWN scope permission
        if (hasPermission(permission)) {
            // If it's an OWN scope permission, verify ownership
            if (permission.scope === 'OWN') {
                return user.userId === resourceOwnerId;
            }
            return true;
        }

        return false;
    };

    /**
     * Convenience methods for common checks
     */
    const can = {
        createBlog: () => hasPermission(PERMISSIONS.BLOG_CREATE),
        updateBlog: (blogOwnerId) => canAccess(PERMISSIONS.BLOG_UPDATE_OWN, blogOwnerId),
        deleteBlog: (blogOwnerId) => canAccess(PERMISSIONS.BLOG_DELETE_OWN, blogOwnerId),

        createComment: () => hasPermission(PERMISSIONS.COMMENT_CREATE),
        updateComment: (commentOwnerId) => canAccess(PERMISSIONS.COMMENT_UPDATE_OWN, commentOwnerId),
        deleteComment: () => hasPermission(PERMISSIONS.COMMENT_DELETE_ALL),
    };

    return {
        hasPermission,
        canAccess,
        can,
        permissions,
    };
};
