from rest_framework import permissions

class IsCustomer(permissions.BasePermission):
    """
    Allows access only to customer users. Admins can also access.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'customer' or request.user.role == 'admin' or request.user.is_staff)
        )

class IsOrganizer(permissions.BasePermission):
    """
    Allows access only to organizer users. Admins can also access.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'organizer' or request.user.role == 'admin' or request.user.is_staff)
        )

class IsPlotOwner(permissions.BasePermission):
    """
    Allows access only to plot owner users. Admins can also access.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'plot_owner' or request.user.role == 'admin' or request.user.is_staff)
        )

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'admin' or request.user.is_staff or request.user.is_superuser)
        )
