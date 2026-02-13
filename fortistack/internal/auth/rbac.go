package auth

import (
	"fmt"
)

func CanAccessTenant(userTenantID *string, userRole Role, targetTenantID string) bool {
	// Platform Admin can access everything
	if userRole == RoleAdmin {
		return true
	}

	// Tenant users can only access their own tenant
	if userTenantID == nil {
		return false // Should not happen for non-admin
	}

	return *userTenantID == targetTenantID
}

func CanWrite(role Role) bool {
	return role == RoleAdmin || role == RoleTenantAdmin
}

func CanManageConfig(role Role) bool {
	return role == RoleAdmin || role == RoleTenantAdmin
}

// CheckPermission is a helper to centralize logic if needed
func CheckPermission(claims *Claims, targetTenantID string, requiredRole Role) error {
	if !CanAccessTenant(&claims.TenantID, Role(claims.Role), targetTenantID) {
		return fmt.Errorf("forbidden: tenant access denied")
	}

	// Role hierarchy check?
	// If required is admin, user must be admin.
	// We only have 3 roles.
	// admin > tenant_admin > viewer.

	userRole := Role(claims.Role)

	if requiredRole == RoleAdmin && userRole != RoleAdmin {
		return fmt.Errorf("forbidden: platform admin required")
	}

	if requiredRole == RoleTenantAdmin && (userRole == RoleViewer) {
		return fmt.Errorf("forbidden: admin or tenant_admin required")
	}

	return nil
}
