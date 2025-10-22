// University Portal Frontend JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize navigation
    initNavigation();
    
    // Initialize modals
    initModals();
    
    // Initialize user display
    updateUserDisplay();
    
    // Initialize main page content
    updateMainPageContent();
    
    // Set initial page
    showPage('main');
}

// Navigation functionality
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetPage = this.getAttribute('data-page');
            if (targetPage) {
                navigateTo(targetPage);
            }
        });
    });
}

function navigateTo(pageId) {
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Add active class to clicked nav item
    const targetNavItem = document.querySelector(`[data-page="${pageId}"]`).closest('.nav-item');
    if (targetNavItem) {
        targetNavItem.classList.add('active');
    }
    
    // Show the target page
    showPage(pageId);
}

function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update URL without page refresh
    history.pushState({ page: pageId }, '', `#${pageId}`);
    
    // Load page-specific content if needed
    loadPageContent(pageId);
}

// Page content loading
function loadPageContent(pageId) {
    switch(pageId) {
        case 'users':
            loadUsersContent();
            break;
        case 'courses':
            loadCoursesContent();
            break;
        case 'schedule':
            loadScheduleContent();
            break;
        case 'settings':
            loadSettingsContent();
            break;
        default:
            // Main page is static, no additional loading needed
            break;
    }
}

// Placeholder content loaders
function loadUsersContent() {
    loadUsers();
}

function loadUsers() {
    makeAuthenticatedRequest('/users/', {
        method: 'GET'
    })
    .then(data => {
        users = data.users || data.results || [];
        displayUsers(users);
        updateUserStats();
    })
    .catch(error => {
        console.error('Error loading users:', error);
        showNotification('Failed to load users. Please try again.', 'error');
        displayUsers([]);
    });
}

function displayUsers(usersToShow = users) {
    const usersTableBody = document.getElementById('users-table-body');
    if (!usersTableBody) return;
    
    if (usersToShow.length === 0) {
        usersTableBody.innerHTML = `
            <tr class="no-users">
                <td colspan="6" class="text-center">
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No users found</p>
                        <button class="btn-primary auth-required" onclick="showCreateUserModal()">Create First User</button>
            </div>
                </td>
            </tr>
        `;
        return;
    }
    
    usersTableBody.innerHTML = usersToShow.map(user => `
        <tr>
            <td>
                <div class="user-name">${user.full_name || `${user.first_name} ${user.last_name}`}</div>
            </td>
            <td>${user.email}</td>
            <td><span class="user-role-badge role-${user.user_role}">${user.user_role}</span></td>
            <td>${user.phone_number || 'Not provided'}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <div class="user-menu-container auth-required" style="display: none;">
                    <button class="user-menu-btn" onclick="event.stopPropagation(); toggleUserMenu(${user.id})" title="More options">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="user-dropdown-menu" id="user-menu-${user.id}">
                        <a href="#" class="dropdown-item" onclick="event.stopPropagation(); editUser(${user.id}); return false;">
                        <i class="fas fa-edit"></i>
                            <span>Update User</span>
                        </a>
                        <a href="#" class="dropdown-item dropdown-item-danger" onclick="event.stopPropagation(); deleteUser(${user.id}); return false;">
                        <i class="fas fa-trash"></i>
                            <span>Delete User</span>
                        </a>
                </div>
            </div>
            </td>
        </tr>
    `).join('');
    
    updateUserVisibility();
}

function updateUserStats() {
    const totalUsers = users.length;
    const adminUsers = users.filter(user => user.user_role === 'admin').length;
    const professorUsers = users.filter(user => user.user_role === 'professor').length;
    const studentUsers = users.filter(user => user.user_role === 'student').length;
    
    // Update stats display
    const totalUsersEl = document.getElementById('total-users');
    const totalStudentsEl = document.getElementById('total-students');
    const totalProfessorsEl = document.getElementById('total-professors');
    const totalAdminsEl = document.getElementById('total-admins');
    
    if (totalUsersEl) totalUsersEl.textContent = totalUsers;
    if (totalStudentsEl) totalStudentsEl.textContent = studentUsers;
    if (totalProfessorsEl) totalProfessorsEl.textContent = professorUsers;
    if (totalAdminsEl) totalAdminsEl.textContent = adminUsers;
}

function toggleUserMenu(userId) {
    const menu = document.getElementById(`user-menu-${userId}`);
    if (!menu) return;
    
    // Close all other menus
    document.querySelectorAll('.user-dropdown-menu').forEach(m => {
        if (m !== menu) {
            m.classList.remove('show');
        }
    });
    
    // Toggle current menu
    menu.classList.toggle('show');
}

// Close user menus when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-menu-container')) {
        document.querySelectorAll('.user-dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

function filterUsers() {
    const searchTerm = document.getElementById('user-search')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('role-filter')?.value || '';
    
    let filteredUsers = users.filter(user => {
        const nameMatch = user.full_name?.toLowerCase().includes(searchTerm) ||
                         user.first_name?.toLowerCase().includes(searchTerm) ||
                         user.last_name?.toLowerCase().includes(searchTerm) ||
                         user.email?.toLowerCase().includes(searchTerm);
        const roleMatch = !roleFilter || user.user_role === roleFilter;
        
        return nameMatch && roleMatch;
    });
    
    displayUsers(filteredUsers);
}

function updateUserVisibility() {
    // Check if user is authenticated
    const savedAuth = localStorage.getItem('authState');
    let isAuthenticated = false;
    
    if (savedAuth) {
        try {
            const authState = JSON.parse(savedAuth);
            isAuthenticated = authState.isAuthenticated;
        } catch (e) {
            console.error('Error parsing saved auth state:', e);
        }
    }
    
    // Show/hide user menu containers
    const userMenus = document.querySelectorAll('.user-menu-container.auth-required');
    userMenus.forEach(menu => {
        if (isAuthenticated) {
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    });
    
    // Show/hide create user button
    const createUserBtn = document.querySelector('.btn-create-user');
    if (createUserBtn) {
        if (isAuthenticated) {
            createUserBtn.style.display = 'flex';
        } else {
            createUserBtn.style.display = 'none';
        }
    }
}

// User Management Functions
function viewUser(userId) {
    loadUserDetailForView(userId);
}

function loadUserDetailForView(userId) {
    makeAuthenticatedRequest(`/users/${userId}/`, {
        method: 'GET'
    })
    .then(data => {
        if (data.success && data.user) {
            showViewUserModal(data.user);
        } else {
            showNotification('Failed to load user details', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading user details:', error);
        showNotification('Failed to load user details. Please try again.', 'error');
    });
}

function showViewUserModal(user) {
    // Create view user modal if it doesn't exist
    let modal = document.getElementById('viewUserModal');
    if (!modal) {
        modal = createViewUserModal();
    }
    
    // Populate modal with user data
    document.getElementById('view-user-name').textContent = user.full_name || `${user.first_name} ${user.last_name}`;
    document.getElementById('view-user-email').textContent = user.email;
    document.getElementById('view-user-role').textContent = user.user_role;
    document.getElementById('view-user-phone').textContent = user.phone_number || 'Not provided';
    document.getElementById('view-user-active').textContent = user.is_active ? 'Yes' : 'No';
    document.getElementById('view-user-created').textContent = new Date(user.created_at).toLocaleString();
    document.getElementById('view-user-updated').textContent = new Date(user.updated_at).toLocaleString();
    
    modal.style.display = 'block';
}

function createViewUserModal() {
    const modalHTML = `
        <div id="viewUserModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>User Details</h2>
                    <span class="close" onclick="closeViewUserModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="user-detail-view">
                        <div class="detail-row">
                            <strong>Name:</strong>
                            <span id="view-user-name"></span>
                        </div>
                        <div class="detail-row">
                            <strong>Email:</strong>
                            <span id="view-user-email"></span>
                        </div>
                        <div class="detail-row">
                            <strong>Role:</strong>
                            <span id="view-user-role"></span>
                        </div>
                        <div class="detail-row">
                            <strong>Phone:</strong>
                            <span id="view-user-phone"></span>
                        </div>
                        <div class="detail-row">
                            <strong>Active:</strong>
                            <span id="view-user-active"></span>
                        </div>
                        <div class="detail-row">
                            <strong>Created:</strong>
                            <span id="view-user-created"></span>
                        </div>
                        <div class="detail-row">
                            <strong>Last Updated:</strong>
                            <span id="view-user-updated"></span>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="closeViewUserModal()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    return document.getElementById('viewUserModal');
}

function closeViewUserModal() {
    const modal = document.getElementById('viewUserModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function editUser(userId) {
    loadUserDetail(userId);
}

function loadUserDetail(userId) {
    makeAuthenticatedRequest(`/users/${userId}/`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.user) {
            showEditUserModal(data.user);
        } else {
            showNotification('Failed to load user details', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading user details:', error);
        showNotification('Failed to load user details. Please try again.', 'error');
    });
}

function showEditUserModal(user) {
    const modal = document.getElementById('editUserModal');
    if (!modal) return;
    
    // Populate form with user data (using static template field IDs)
    const idField = document.getElementById('edit-user-id');
    const firstNameField = document.getElementById('edit-first-name');
    const lastNameField = document.getElementById('edit-last-name');
    const fatherNameField = document.getElementById('edit-father-name');
    const emailField = document.getElementById('edit-email');
    const phoneField = document.getElementById('edit-phone');
    const roleField = document.getElementById('edit-user-role');
    const dobField = document.getElementById('edit-date-of-birth');
    const activeField = document.getElementById('edit-is-active');
    
    if (idField) idField.value = user.id;
    if (firstNameField) firstNameField.value = user.first_name || '';
    if (lastNameField) lastNameField.value = user.last_name || '';
    if (fatherNameField) fatherNameField.value = user.father_name || '';
    if (emailField) emailField.value = user.email;
    if (phoneField) phoneField.value = user.phone_number || '';
    if (roleField) roleField.value = user.user_role;
    if (dobField) dobField.value = user.date_of_birth || '';
    if (activeField) activeField.checked = user.is_active;
    
    modal.style.display = 'block';
}

function createEditUserModal() {
    const modalHTML = `
        <div id="editUserModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit User</h2>
                    <span class="close" onclick="closeEditUserModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="editUserForm">
                        <input type="hidden" id="edit-user-id" name="id">
                        <div class="form-group">
                            <label for="edit-user-email">Email:</label>
                            <input type="email" id="edit-user-email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-user-first-name">First Name:</label>
                            <input type="text" id="edit-user-first-name" name="first_name">
                        </div>
                        <div class="form-group">
                            <label for="edit-user-last-name">Last Name:</label>
                            <input type="text" id="edit-user-last-name" name="last_name">
                        </div>
                        <div class="form-group">
                            <label for="edit-user-phone">Phone Number:</label>
                            <input type="tel" id="edit-user-phone" name="phone_number">
                        </div>
                        <div class="form-group">
                            <label for="edit-user-role">Role:</label>
                            <select id="edit-user-role" name="user_role">
                                <option value="student">Student</option>
                                <option value="professor">Professor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="edit-user-active" name="is_active"> Active
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="closeEditUserModal()">Cancel</button>
                            <button type="submit">Update User</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add form submit handler
    document.getElementById('editUserForm').addEventListener('submit', handleUpdateUser);
    
    return document.getElementById('editUserModal');
}

function handleUpdateUser(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userId = formData.get('user_id');
    const userData = {
        email: formData.get('email'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        father_name: formData.get('father_name'),
        phone_number: formData.get('phone_number'),
        user_role: formData.get('user_role'),
        date_of_birth: formData.get('date_of_birth'),
        is_active: formData.get('is_active') === 'on'
    };
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Updating...';
    submitButton.disabled = true;
    
    makeAuthenticatedRequest(`/users/${userId}/update/`, {
        method: 'PUT',
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        if (data.success) {
            showNotification('User updated successfully', 'success');
            closeEditUserModal();
            loadUsers(); // Reload users list
        } else {
            showNotification(data.error || 'Failed to update user', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating user:', error);
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        showNotification('Failed to update user. Please try again.', 'error');
    });
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function deleteUser(userId) {
    if (!requireAuth('delete user')) {
        return;
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) {
        showNotification('User not found', 'error');
        return;
    }
    
    userToDelete = user;
    
    // Show user info in delete confirmation modal
    const userInfoElement = document.getElementById('delete-user-info');
    if (userInfoElement) {
        userInfoElement.textContent = `${user.full_name || `${user.first_name} ${user.last_name}`} (${user.email})`;
    }
    
    // Show delete confirmation modal
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeDeleteConfirmModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
    userToDelete = null;
}

function confirmDeleteUser() {
    if (!userToDelete) return;
    
    const deleteBtn = document.getElementById('confirmDeleteBtn');
    const originalText = deleteBtn.innerHTML;
    const userName = userToDelete.full_name || `${userToDelete.first_name} ${userToDelete.last_name}`;
    
    // Show loading state
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    deleteBtn.disabled = true;
    
    // Make authenticated API call to delete user
    makeAuthenticatedRequest(`/users/${userToDelete.id}/delete/`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
            // Close modal
            closeDeleteConfirmModal();
            
            // Show success message
            showNotification(`User "${userName}" deleted successfully!`, 'success');
            
            // Reload users list from API
            loadUsers();
            } else {
            throw new Error(data.error || 'Failed to delete user');
            }
        })
        .catch(error => {
            console.error('Error deleting user:', error);
        
        // Reset button
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
        
        // Show error message
        showNotification(error.message || 'Failed to delete user. Please try again.', 'error');
    });
}

function showCreateUserModal() {
    const modal = document.getElementById('createUserModal');
    if (modal) {
    // Clear form
        const form = document.getElementById('createUserForm');
        if (form) {
            form.reset();
        }
    modal.style.display = 'block';
    }
}

function createCreateUserModal() {
    const modalHTML = `
        <div id="createUserModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create New User</h2>
                    <span class="close" onclick="closeCreateUserModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="createUserForm">
                        <div class="form-group">
                            <label for="create-user-email">Email:</label>
                            <input type="email" id="create-user-email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="create-user-password">Password:</label>
                            <input type="password" id="create-user-password" name="password" required>
                        </div>
                        <div class="form-group">
                            <label for="create-user-first-name">First Name:</label>
                            <input type="text" id="create-user-first-name" name="first_name">
                        </div>
                        <div class="form-group">
                            <label for="create-user-last-name">Last Name:</label>
                            <input type="text" id="create-user-last-name" name="last_name">
                        </div>
                        <div class="form-group">
                            <label for="create-user-phone">Phone Number:</label>
                            <input type="tel" id="create-user-phone" name="phone_number">
                        </div>
                        <div class="form-group">
                            <label for="create-user-role">Role:</label>
                            <select id="create-user-role" name="user_role">
                                <option value="student">Student</option>
                                <option value="professor">Professor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="create-user-active" name="is_active" checked> Active
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="closeCreateUserModal()">Cancel</button>
                            <button type="submit">Create User</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add form submit handler
    document.getElementById('createUserForm').addEventListener('submit', handleCreateUser);
    
    return document.getElementById('createUserModal');
}

function handleCreateUser(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        email: formData.get('email'),
        password: formData.get('password'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        father_name: formData.get('father_name'),
        phone_number: formData.get('phone_number'),
        user_role: formData.get('user_role'),
        date_of_birth: formData.get('date_of_birth'),
        is_active: formData.get('is_active') === 'on'
    };
    
    // Basic validation
    if (!userData.email || !userData.password || !userData.first_name || !userData.last_name || !userData.user_role) {
        showNotification('Email, password, first name, last name, and role are required', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creating...';
    submitButton.disabled = true;
    
    makeAuthenticatedRequest('/users/create/', {
        method: 'POST',
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }).catch(() => {
            throw new Error(`HTTP error! status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        if (data.success) {
            showNotification(`User "${data.user.first_name} ${data.user.last_name}" created successfully!`, 'success');
            closeCreateUserModal();
            loadUsers(); // Reload users list
        } else {
            showNotification(data.error || 'Failed to create user', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating user:', error);
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        showNotification(error.message || 'Failed to create user. Please try again.', 'error');
    });
}

function closeCreateUserModal() {
    const modal = document.getElementById('createUserModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function loadCoursesContent() {
    loadCourses();
}


function loadScheduleContent() {
    // Future implementation for loading schedule via API
}

function loadSettingsContent() {
    // Future implementation for settings management
}

// Modal functionality
function initModals() {
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('loginModal');
        if (e.target === modal) {
            closeLoginModal();
        }
    });
    
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Handle create course form submission
    const createCourseForm = document.getElementById('createCourseForm');
    if (createCourseForm) {
        createCourseForm.addEventListener('submit', handleCreateCourse);
    }
    
    // Handle edit course form submission
    const editCourseForm = document.getElementById('editCourseForm');
    if (editCourseForm) {
        editCourseForm.addEventListener('submit', handleUpdateCourse);
    }
    
    // Handle delete course confirmation button
    const confirmDeleteCourseBtn = document.getElementById('confirmDeleteCourseBtn');
    if (confirmDeleteCourseBtn) {
        confirmDeleteCourseBtn.addEventListener('click', confirmDeleteCourse);
    }
    
    // Handle create lesson form submission
    const createLessonForm = document.getElementById('createLessonForm');
    if (createLessonForm) {
        createLessonForm.addEventListener('submit', handleCreateLesson);
    }
    
    // Handle edit lesson form submission
    const editLessonForm = document.getElementById('editLessonForm');
    if (editLessonForm) {
        editLessonForm.addEventListener('submit', handleUpdateLesson);
    }
    
    // Handle delete lesson confirmation button
    const confirmDeleteLessonBtn = document.getElementById('confirmDeleteLessonBtn');
    if (confirmDeleteLessonBtn) {
        confirmDeleteLessonBtn.addEventListener('click', confirmDeleteLesson);
    }
    
    // Handle delete user confirmation button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteUser);
    }
    
    // Handle create user form submission
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        createUserForm.addEventListener('submit', handleCreateUser);
    }
    
    // Handle edit user form submission
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleUpdateUser);
    }
    
    // Handle create event form submission
    const createEventForm = document.getElementById('createEventForm');
    if (createEventForm) {
        createEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreateEvent();
        });
    }
    
    // Handle edit event form submission
    const editEventForm = document.getElementById('editEventForm');
    if (editEventForm) {
        editEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleUpdateEvent();
        });
    }
    
    // Handle delete event confirmation button
    const confirmDeleteEventBtn = document.getElementById('confirmDeleteEventBtn');
    if (confirmDeleteEventBtn) {
        confirmDeleteEventBtn.addEventListener('click', confirmDeleteEvent);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const createEventModal = document.getElementById('createEventModal');
        const editEventModal = document.getElementById('editEventModal');
        const dayEventsModal = document.getElementById('dayEventsModal');
        const deleteEventModal = document.getElementById('deleteEventConfirmModal');
        
        if (e.target === createEventModal) {
            closeCreateEventModal();
        }
        if (e.target === editEventModal) {
            closeEditEventModal();
        }
        if (e.target === dayEventsModal) {
            closeDayEventsModal();
        }
        if (e.target === deleteEventModal) {
            closeDeleteEventConfirmModal();
        }
    });
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus on email input
        setTimeout(() => {
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.focus();
            }
        }, 100);
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Clear form
        const form = document.getElementById('loginForm');
        if (form) {
            form.reset();
        }
    }
}

// Authentication functionality
function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Basic validation
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;
    
    // Make real API call to login
    const loginUrl = '/users/login/';
    
    fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }
        
        return response.json();
    })
    .then(data => {
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        if (data.success && data.user && data.access_token) {
            // Save authentication state with JWT tokens
            const authState = {
                isAuthenticated: true,
                user: data.user,
                accessToken: data.access_token,
                refreshToken: data.refresh_token
            };
            
            localStorage.setItem('authState', JSON.stringify(authState));
            
            // Update UI
            updateUserDisplay();
            updateMainPageContent();
            
            // Close modal and show success
            closeLoginModal();
            showNotification('Login successful!', 'success');
        } else {
            console.error('Login response missing required fields:', data);
            showNotification(data.error || 'Login failed. Please check your credentials.', 'error');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        showNotification(`Login failed: ${error.message}`, 'error');
    });
}

function logout() {
    // Clear authentication state (JWT tokens are stateless)
    localStorage.removeItem('authState');
    
    // Update UI to show logged out state
    updateUserDisplay();
    updateMainPageContent();
    
    // Navigate to main page
    navigateTo('main');
    
    showNotification('Logged out successfully', 'success');
}

// JWT Token Management
function getAuthToken() {
    const authState = localStorage.getItem('authState');
    if (authState) {
        const parsed = JSON.parse(authState);
        return parsed.accessToken;
    }
    return null;
}

function getCurrentUser() {
    const authState = localStorage.getItem('authState');
    if (authState) {
        try {
            const parsed = JSON.parse(authState);
            return parsed.user;
        } catch (e) {
            return null;
        }
    }
    return null;
}

function getRefreshToken() {
    const authState = localStorage.getItem('authState');
    if (authState) {
        const parsed = JSON.parse(authState);
        return parsed.refreshToken;
    }
    return null;
}

function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return Promise.reject('No refresh token available');
    }
    
    return fetch('/users/refresh-token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.access_token) {
            // Update stored access token
            const authState = JSON.parse(localStorage.getItem('authState'));
            authState.accessToken = data.access_token;
            localStorage.setItem('authState', JSON.stringify(authState));
            return data.access_token;
        } else {
            throw new Error('Failed to refresh token');
        }
    });
}

function makeAuthenticatedRequest(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
        return Promise.reject('No authentication token available');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    return fetch(url, {
        ...options,
        headers
    })
    .then(response => {
        if (response.status === 401) {
            // Token expired, try to refresh
            return refreshAccessToken()
                .then(newToken => {
                    // Retry request with new token
                    const newHeaders = {
                        ...headers,
                        'Authorization': `Bearer ${newToken}`
                    };
                    return fetch(url, {
                        ...options,
                        headers: newHeaders
                    });
                })
                .catch(() => {
                    // Refresh failed, redirect to login
                    logout();
                    throw new Error('Authentication expired. Please login again.');
                });
        }
        
        // Handle other HTTP errors
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse JSON response
        return response.json();
    });
}

// User dropdown functionality
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdownMenu');
    const chevron = document.querySelector('.user-details i.fa-chevron-up');
    
    if (dropdown) {
        dropdown.classList.toggle('show');
        
        // Rotate chevron icon
        if (chevron) {
            chevron.style.transform = dropdown.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
}

function closeUserDropdown() {
    const dropdown = document.getElementById('userDropdownMenu');
    const chevron = document.querySelector('.user-details i.fa-chevron-up');
    
    if (dropdown) {
        dropdown.classList.remove('show');
        
        // Reset chevron icon
        if (chevron) {
            chevron.style.transform = 'rotate(0deg)';
        }
    }
}

// Update user display and menu visibility
function updateUserDisplay() {
    const userInfoDiv = document.querySelector('.user-info');
    const sidebar = document.querySelector('.sidebar');
    const appContainer = document.querySelector('.app-container');
    
    if (!userInfoDiv) return;
    
    // Check if user is authenticated
    const savedAuth = localStorage.getItem('authState');
    let isAuthenticated = false;
    let user = null;
    
    if (savedAuth) {
        try {
            const authState = JSON.parse(savedAuth);
            isAuthenticated = authState.isAuthenticated;
            user = authState.user;
        } catch (e) {
            console.error('Error parsing saved auth state:', e);
        }
    }
    
    if (isAuthenticated && user) {
        // Add logged-in class to sidebar and app container for menu and dashboard visibility
        if (sidebar) {
            sidebar.classList.add('logged-in');
        }
        if (appContainer) {
            appContainer.classList.add('logged-in');
        }
        
        userInfoDiv.innerHTML = `
            <div class="user-dropdown">
                <div class="user-details" onclick="toggleUserDropdown()">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-text">
                        <div class="user-name">${user.first_name} ${user.last_name}</div>
                        <div class="user-role">${user.user_role || 'User'}</div>
                    </div>
                    <i class="fas fa-chevron-up"></i>
                </div>
                <div class="dropdown-menu" id="userDropdownMenu">
                    <a href="#" class="dropdown-item" onclick="navigateTo('settings'); closeUserDropdown();">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                    </a>
                    <a href="#" class="dropdown-item" onclick="logout(); closeUserDropdown();">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Log Out</span>
                    </a>
                </div>
            </div>
        `;
    } else {
        // Remove logged-in class from sidebar and app container
        if (sidebar) {
            sidebar.classList.remove('logged-in');
        }
        if (appContainer) {
            appContainer.classList.remove('logged-in');
        }
        
        userInfoDiv.innerHTML = `
            <div class="login-prompt">
                <button class="btn-login" onclick="showLoginModal()">
                    <i class="fas fa-sign-in-alt"></i>
                    Log In
                </button>
            </div>
        `;
    }
    
    // Update lesson visibility if we're on course detail page
    if (document.getElementById('course-detail-page') && document.getElementById('course-detail-page').classList.contains('active')) {
        updateLessonVisibility();
    }
    
    // Update course visibility if we're on courses page
    if (document.getElementById('courses-page') && document.getElementById('courses-page').classList.contains('active')) {
        updateCourseVisibility();
    }
}

// Update main page content based on authentication status
function updateMainPageContent() {
    const subtitle = document.getElementById('main-subtitle');
    
    if (!subtitle) return;
    
    // Check if user is authenticated
    const savedAuth = localStorage.getItem('authState');
    let isAuthenticated = false;
    
    if (savedAuth) {
        try {
            const authState = JSON.parse(savedAuth);
            isAuthenticated = authState.isAuthenticated;
        } catch (e) {
            console.error('Error parsing saved auth state:', e);
        }
    }
    
    if (isAuthenticated) {
        subtitle.textContent = 'Your central hub for academic and administrative activities';
    } else {
        subtitle.textContent = 'Explore our course catalog and discover educational opportunities';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const userDropdown = document.querySelector('.user-dropdown');
    const dropdownMenu = document.getElementById('userDropdownMenu');
    const chevron = document.querySelector('.user-details i.fa-chevron-up');
    
    if (userDropdown && dropdownMenu && !userDropdown.contains(e.target)) {
        dropdownMenu.classList.remove('show');
        
        // Reset chevron icon
        if (chevron) {
            chevron.style.transform = 'rotate(0deg)';
        }
    }
});

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 3000;
                min-width: 300px;
                max-width: 500px;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-info {
                background-color: #EBF8FF;
                border-left: 4px solid #3182CE;
                color: #2A4365;
            }
            
            .notification-error {
                background-color: #FED7D7;
                border-left: 4px solid #E53E3E;
                color: #742A2A;
            }
            
            .notification-success {
                background-color: #F0FFF4;
                border-left: 4px solid #38A169;
                color: #22543D;
            }
            
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .notification-message {
                flex: 1;
                margin-right: 12px;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.3s;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(e) {
    if (e.state && e.state.page) {
        showPage(e.state.page);
        
        // Update active nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        const targetNavItem = document.querySelector(`[data-page="${e.state.page}"]`).closest('.nav-item');
        if (targetNavItem) {
            targetNavItem.classList.add('active');
        }
    }
});

// Mobile responsiveness
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Initialize responsive behavior
function initResponsive() {
    // Add mobile menu button if on mobile
    if (window.innerWidth <= 768) {
        addMobileMenuButton();
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.remove('open');
            }
            removeMobileMenuButton();
        } else {
            addMobileMenuButton();
        }
    });
}

function addMobileMenuButton() {
    if (document.querySelector('.mobile-menu-button')) return;
    
    const button = document.createElement('button');
    button.className = 'mobile-menu-button';
    button.innerHTML = '<i class="fas fa-bars"></i>';
    button.onclick = toggleSidebar;
    
    // Add button styles
    button.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1001;
        background-color: #202945;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 18px;
    `;
    
    document.body.appendChild(button);
}

function removeMobileMenuButton() {
    const button = document.querySelector('.mobile-menu-button');
    if (button) {
        button.remove();
    }
}

// Initialize responsive features
document.addEventListener('DOMContentLoaded', function() {
    initResponsive();
});

// API helper functions (for future implementation)
const API = {
    baseURL: '/api',
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            showNotification(error.message, 'error');
            throw error;
        }
    },
    
    get(endpoint) {
        return this.request(endpoint);
    },
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
};

// Authentication helper function
function requireAuth(action) {
    const savedAuth = localStorage.getItem('authState');
    let isAuthenticated = false;
    let user = null;
    
    if (savedAuth) {
        try {
            const authState = JSON.parse(savedAuth);
            isAuthenticated = authState.isAuthenticated;
            user = authState.user;
        } catch (e) {
            console.error('Error parsing saved auth state:', e);
        }
    }
    
    if (!isAuthenticated) {
        showNotification(`Please log in to ${action}`, 'error');
        showLoginModal();
        return false;
    }
    
    // Check if user has admin or professor role for course/lesson management
    if (action.includes('course') || action.includes('lesson')) {
        if (user && user.user_role && !['admin', 'professor'].includes(user.user_role)) {
            showNotification(`You don't have permission to ${action}`, 'error');
            return false;
        }
    }
    
    return true;
}

// Course Management Functions
let courses = []; // Store courses data
let courseToDelete = null;
let currentCourse = null; // Store current course being viewed
let lessons = []; // Store lessons data
let lessonToDelete = null;
let users = []; // Store users data
let userToDelete = null;

// Load courses from API
function loadCourses() {
    makeAuthenticatedRequest('/courses/', {
        method: 'GET'
    })
    .then(data => {
        courses = data.courses || []; // Handle Django API response format
        displayCourses(courses);
        updateCourseStats();
    })
    .catch(error => {
        console.error('Error loading courses:', error);
        showNotification('Failed to load courses. Please try again.', 'error');
        // Show empty state instead of demo data
        displayCourses([]);
    });
}

function displayCourses(coursesToShow = courses) {
    const coursesGrid = document.getElementById('courses-grid');
    if (!coursesGrid) return;
    
    if (coursesToShow.length === 0) {
        coursesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>No courses found</p>
                <button class="btn-primary auth-required" onclick="showCreateCourseModal()" style="display: none;">Create First Course</button>
            </div>
        `;
        return;
    }
    
    coursesGrid.innerHTML = coursesToShow.map(course => `
        <div class="course-card" onclick="navigateToCourse(${course.id})">
            <div class="course-card-header">
                ${course.image_url ? 
                    `<img src="${course.image_url}" alt="${course.title}" class="course-card-image">` :
                    `<div style="font-size: 48px;"><i class="fas fa-book"></i></div>`
                }
                <div class="course-menu-container auth-required" style="display: none;">
                    <button class="course-menu-btn" onclick="event.stopPropagation(); toggleCourseMenu(${course.id})" title="More options">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="course-dropdown-menu" id="course-menu-${course.id}">
                        <a href="#" class="dropdown-item" onclick="event.stopPropagation(); editCourse(${course.id}); return false;">
                            <i class="fas fa-edit"></i>
                            <span>Update Course</span>
                        </a>
                        <a href="#" class="dropdown-item dropdown-item-danger" onclick="event.stopPropagation(); deleteCourse(${course.id}); return false;">
                            <i class="fas fa-trash"></i>
                            <span>Delete Course</span>
                        </a>
                    </div>
                </div>
            </div>
            <div class="course-card-content">
                <h3 class="course-card-title">${course.title}</h3>
                <p class="course-card-description">${course.description}</p>
                
                <div class="course-card-meta">
                    <span class="course-status-badge ${course.is_active ? 'status-active' : 'status-inactive'}">
                        ${course.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span>${formatDate(course.created_at)}</span>
                </div>
                
                <div class="course-card-stats">
                    <div class="course-stat">
                        <i class="fas fa-list-ol"></i>
                        <span>${course.lessons_count} lessons</span>
                    </div>
                    <div class="course-stat">
                        <i class="fas fa-user"></i>
                        <span>${course.created_by_name}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Update course visibility after rendering
    updateCourseVisibility();
}

function updateCourseStats() {
    document.getElementById('total-courses').textContent = courses.length;
    document.getElementById('active-courses').textContent = courses.filter(c => c.is_active).length;
    document.getElementById('total-lessons').textContent = courses.reduce((sum, c) => sum + c.lessons_count, 0);
    
    // Get current user's courses
    const savedAuth = localStorage.getItem('authState');
    if (savedAuth) {
        try {
            const authState = JSON.parse(savedAuth);
            if (authState.user) {
                const myCourses = courses.filter(c => c.created_by_name === `${authState.user.first_name} ${authState.user.last_name}`);
                document.getElementById('courses-by-me').textContent = myCourses.length;
            }
        } catch (e) {
            console.error('Error parsing saved auth state:', e);
        }
    }
}

function filterCourses() {
    const searchTerm = document.getElementById('course-search').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    
    let filteredCourses = courses.filter(course => {
        const titleMatch = course.title.toLowerCase().includes(searchTerm) ||
                          course.description.toLowerCase().includes(searchTerm);
        const statusMatch = !statusFilter || 
                          (statusFilter === 'active' && course.is_active) ||
                          (statusFilter === 'inactive' && !course.is_active);
        
        return titleMatch && statusMatch;
    });
    
    displayCourses(filteredCourses);
}

// Course CRUD Functions
function showCreateCourseModal() {
    if (!requireAuth('create course')) {
        return;
    }
    
    const modal = document.getElementById('createCourseModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus on title input
        setTimeout(() => {
            const titleInput = document.getElementById('create-course-title');
            if (titleInput) {
                titleInput.focus();
            }
        }, 100);
    }
}

function closeCreateCourseModal() {
    const modal = document.getElementById('createCourseModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Clear form
        const form = document.getElementById('createCourseForm');
        if (form) {
            form.reset();
        }
    }
}

function handleCreateCourse(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const courseData = {
        title: formData.get('title'),
        description: formData.get('description'),
        is_active: formData.get('is_active') === 'on'
    };
    
    // Basic validation
    if (!courseData.title || !courseData.description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creating...';
    submitButton.disabled = true;
    
    // Make API call to create course
    makeAuthenticatedRequest('/courses/create/', {
        method: 'POST',
        body: JSON.stringify(courseData)
    })
    .then(data => {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        if (data.success) {
            // Close modal
            closeCreateCourseModal();
            
            // Show success message
            showNotification(`Course "${data.course.title}" created successfully!`, 'success');
            
            // Navigate to courses page and reload courses
            navigateTo('courses');
            loadCourses(); // This will refresh the courses list from the API
        } else {
            showNotification(data.error || 'Failed to create course', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating course:', error);
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Show error message
        showNotification('Failed to create course. Please try again.', 'error');
    });
}

function editCourse(courseId) {
    if (!requireAuth('edit course')) {
        return;
    }
    
    const course = courses.find(c => c.id === courseId);
    if (!course) {
        alert('Course not found');
        return;
    }
    
    // Populate the edit form with course data
    document.getElementById('edit-course-id').value = course.id;
    document.getElementById('edit-course-title').value = course.title || '';
    document.getElementById('edit-course-description').value = course.description || '';
    document.getElementById('edit-course-active').checked = course.is_active;
    
    // Show the edit modal
    const modal = document.getElementById('editCourseModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus on title input
        setTimeout(() => {
            document.getElementById('edit-course-title').focus();
        }, 100);
    }
}

function closeEditCourseModal() {
    const modal = document.getElementById('editCourseModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Clear form
        const form = document.getElementById('editCourseForm');
        if (form) {
            form.reset();
        }
    }
}

function handleUpdateCourse(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const courseId = formData.get('course_id');
    const courseData = {
        title: formData.get('title'),
        description: formData.get('description'),
        is_active: formData.get('is_active') === 'on'
    };
    
    // Basic validation
    if (!courseData.title || !courseData.description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Updating...';
    submitButton.disabled = true;
    
    // Make API call to update course
    makeAuthenticatedRequest(`/courses/${courseId}/update/`, {
        method: 'PUT',
        body: JSON.stringify(courseData)
    })
    .then(data => {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        if (data.success) {
            // Close modal
            closeEditCourseModal();
            
            // Show success message
            showNotification(`Course "${data.course.title}" updated successfully!`, 'success');
            
            // Reload courses list from API
            loadCourses();
        } else {
            showNotification(data.error || 'Failed to update course', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating course:', error);
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Show error message
        showNotification('Failed to update course. Please try again.', 'error');
    });
}


function deleteCourse(courseId) {
    if (!requireAuth('delete course')) {
        return;
    }
    
    const course = courses.find(c => c.id === courseId);
    if (!course) {
        alert('Course not found');
        return;
    }
    
    courseToDelete = course;
    
    // Show course info in delete confirmation modal
    const courseInfoElement = document.getElementById('delete-course-info');
    if (courseInfoElement) {
        courseInfoElement.textContent = `${course.title} (${course.lessons_count} lessons)`;
    }
    
    // Show delete confirmation modal
    const modal = document.getElementById('deleteCourseConfirmModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeDeleteCourseConfirmModal() {
    const modal = document.getElementById('deleteCourseConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
    courseToDelete = null;
}

function confirmDeleteCourse() {
    if (!courseToDelete) return;
    
    const deleteBtn = document.getElementById('confirmDeleteCourseBtn');
    const originalText = deleteBtn.innerHTML;
    const courseTitle = courseToDelete.title;
    
    // Show loading state
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    deleteBtn.disabled = true;
    
    // Make authenticated API call to delete course
    makeAuthenticatedRequest(`/courses/${courseToDelete.id}/delete/`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
        // Close modal
        closeDeleteCourseConfirmModal();
        
        // Show success message
            showNotification(`Course "${courseTitle}" deleted successfully!`, 'success');
            
            // Navigate to courses page and reload courses
            navigateTo('courses');
            loadCourses();
        } else {
            throw new Error(data.error || 'Failed to delete course');
        }
    })
    .catch(error => {
        console.error('Error deleting course:', error);
        
        // Reset button
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
        
        // Show error message
        showNotification(error.message || 'Failed to delete course. Please try again.', 'error');
    });
}

// Course Navigation Functions
function navigateToCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) {
        alert('Course not found');
        return;
    }
    
    currentCourse = course;
    showCourseDetailPage();
    loadCourseLessons();
}

function showCourseDetailPage() {
    if (!currentCourse) return;
    
    // Update course detail page content
    document.getElementById('course-detail-title').textContent = currentCourse.title;
    document.getElementById('course-detail-subtitle').textContent = `Course information and lessons`;
    
    // Update course info card
    document.getElementById('course-info-title').textContent = currentCourse.title;
    document.getElementById('course-info-status').textContent = currentCourse.is_active ? 'Active' : 'Inactive';
    document.getElementById('course-info-status').className = `course-status-badge ${currentCourse.is_active ? 'status-active' : 'status-inactive'}`;
    document.getElementById('course-info-creator').textContent = `Created by: ${currentCourse.created_by_name}`;
    document.getElementById('course-info-date').textContent = `Created: ${formatDate(currentCourse.created_at)}`;
    document.getElementById('course-info-description-text').textContent = currentCourse.description;
    
    // Update course image
    const imagePlaceholder = document.getElementById('course-info-image-placeholder');
    if (currentCourse.image_url) {
        imagePlaceholder.innerHTML = `<img src="${currentCourse.image_url}" alt="${currentCourse.title}">`;
    } else {
        imagePlaceholder.innerHTML = '<i class="fas fa-book"></i>';
    }
    
    // Navigate to course detail page
    showPage('course-detail');
    
    // Update lesson visibility based on auth status
    updateLessonVisibility();
}

// Lesson Management Functions
function loadCourseLessons() {
    if (!currentCourse) return;
    
    makeAuthenticatedRequest(`/courses/lessons/?course=${currentCourse.id}`, {
        method: 'GET'
    })
    .then(data => {
        lessons = data.lessons || data.results || [];
        displayLessons();
        updateLessonsCount();
    })
    .catch(error => {
        console.error('Error loading lessons:', error);
        showNotification('Failed to load lessons. Please try again.', 'error');
        // Show empty state instead of demo data
        displayLessons([]);
    });
}

function displayLessons() {
    const lessonsList = document.getElementById('lessons-list');
    if (!lessonsList) return;
    
    if (lessons.length === 0) {
        lessonsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list-ol"></i>
                <p>No lessons available yet</p>
                <button class="btn-primary auth-required" onclick="showCreateLessonModal()">Create First Lesson</button>
            </div>
        `;
        
        // Update lesson visibility for empty state
        updateLessonVisibility();
        return;
    }
    
    // Sort lessons by order
    const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
    
    lessonsList.innerHTML = sortedLessons.map(lesson => `
        <div class="lesson-card">
            <div class="lesson-card-header">
                <div class="lesson-order-badge">${lesson.order}</div>
                <div class="lesson-title">${lesson.title}</div>
                <div class="lesson-actions auth-required">
                    <button class="btn-icon btn-edit" onclick="editLesson(${lesson.id})" title="Edit Lesson">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteLesson(${lesson.id})" title="Delete Lesson">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="lesson-description-text">${lesson.short_description}</div>
            <a href="#" class="lesson-toggle-text" onclick="toggleLessonText(${lesson.id}); return false;">
                <span id="toggle-text-${lesson.id}">Show full text</span>
            </a>
            <div class="lesson-full-text" id="lesson-text-${lesson.id}">
                ${lesson.full_text}
            </div>
        </div>
    `).join('');
    
    // Update lesson visibility after rendering
    updateLessonVisibility();
}

function toggleCourseMenu(courseId) {
    const menu = document.getElementById(`course-menu-${courseId}`);
    if (!menu) return;
    
    // Close all other menus
    document.querySelectorAll('.course-dropdown-menu').forEach(m => {
        if (m !== menu) {
            m.classList.remove('show');
        }
    });
    
    // Toggle current menu
    menu.classList.toggle('show');
}

// Close course menus when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.course-menu-container')) {
        document.querySelectorAll('.course-dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

function updateCourseVisibility() {
    // Check if user is authenticated
    const savedAuth = localStorage.getItem('authState');
    let isAuthenticated = false;
    
    if (savedAuth) {
        try {
            const authState = JSON.parse(savedAuth);
            isAuthenticated = authState.isAuthenticated;
        } catch (e) {
            console.error('Error parsing saved auth state:', e);
        }
    }
    
    // Show/hide course menu containers
    const courseMenus = document.querySelectorAll('.course-menu-container.auth-required');
    courseMenus.forEach(menu => {
        if (isAuthenticated) {
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    });
    
    // Show/hide create course button
    const createCourseBtn = document.querySelector('.btn-create-course.auth-required');
    if (createCourseBtn) {
        if (isAuthenticated) {
            createCourseBtn.style.display = 'flex';
        } else {
            createCourseBtn.style.display = 'none';
        }
    }
    
    // Show/hide create first course button in empty state
    const emptyStateBtn = document.querySelector('.courses-grid-container .empty-state .auth-required');
    if (emptyStateBtn) {
        if (isAuthenticated) {
            emptyStateBtn.style.display = 'block';
        } else {
            emptyStateBtn.style.display = 'none';
        }
    }
}

function updateLessonsCount() {
    const lessonsCountElement = document.getElementById('lessons-count');
    if (lessonsCountElement) {
        lessonsCountElement.textContent = lessons.length;
    }
}

function updateLessonVisibility() {
    // Check if user is authenticated
    const savedAuth = localStorage.getItem('authState');
    let isAuthenticated = false;
    
    if (savedAuth) {
        try {
            const authState = JSON.parse(savedAuth);
            isAuthenticated = authState.isAuthenticated;
        } catch (e) {
            console.error('Error parsing saved auth state:', e);
        }
    }
    
    // Show/hide auth-required elements in lessons
    const lessonActions = document.querySelectorAll('.lesson-actions.auth-required');
    lessonActions.forEach(action => {
        if (isAuthenticated) {
            action.style.display = 'flex';
        } else {
            action.style.display = 'none';
        }
    });
    
    // Show/hide create lesson button
    const createLessonBtn = document.querySelector('.btn-create-lesson.auth-required');
    if (createLessonBtn) {
        if (isAuthenticated) {
            createLessonBtn.style.display = 'flex';
        } else {
            createLessonBtn.style.display = 'none';
        }
    }
    
    // Show/hide create first lesson button in empty state
    const emptyStateBtn = document.querySelector('.lessons-list .empty-state .auth-required');
    if (emptyStateBtn) {
        if (isAuthenticated) {
            emptyStateBtn.style.display = 'block';
        } else {
            emptyStateBtn.style.display = 'none';
        }
    }
}

function toggleLessonText(lessonId) {
    const textElement = document.getElementById(`lesson-text-${lessonId}`);
    const toggleElement = document.getElementById(`toggle-text-${lessonId}`);
    
    if (textElement && toggleElement) {
        if (textElement.classList.contains('expanded')) {
            textElement.classList.remove('expanded');
            toggleElement.textContent = 'Show full text';
        } else {
            textElement.classList.add('expanded');
            toggleElement.textContent = 'Hide full text';
        }
    }
}

// Lesson CRUD Functions
function showCreateLessonModal() {
    if (!requireAuth('create lesson')) {
        return;
    }
    
    const modal = document.getElementById('createLessonModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Set suggested order (next available)
        const orderInput = document.getElementById('create-lesson-order');
        if (orderInput && lessons.length > 0) {
            const maxOrder = Math.max(...lessons.map(l => l.order || 0));
            orderInput.value = maxOrder + 1;
            // Add placeholder showing existing orders
            const existingOrders = lessons.map(l => l.order).sort((a, b) => a - b).join(', ');
            orderInput.placeholder = `Existing orders: ${existingOrders}`;
        } else if (orderInput) {
            orderInput.value = 1;
        }
        
        // Focus on title input
        setTimeout(() => {
            const titleInput = document.getElementById('create-lesson-title');
            if (titleInput) {
                titleInput.focus();
            }
        }, 100);
    }
}

function closeCreateLessonModal() {
    const modal = document.getElementById('createLessonModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Clear form
        const form = document.getElementById('createLessonForm');
        if (form) {
            form.reset();
        }
    }
}

function handleCreateLesson(e) {
    e.preventDefault();
    
    if (!currentCourse) {
        showNotification('No course selected', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const lessonData = {
        course: currentCourse.id,
        title: formData.get('title'),
        short_description: formData.get('short_description'),
        full_text: formData.get('full_text'),
        order: parseInt(formData.get('order')) || 1
    };
    
    // Basic validation
    if (!lessonData.title || !lessonData.short_description || !lessonData.full_text) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Check if order already exists
    const orderExists = lessons.some(lesson => lesson.order === lessonData.order);
    if (orderExists) {
        showNotification(`Order ${lessonData.order} already exists. Please choose a different order.`, 'error');
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creating...';
    submitButton.disabled = true;
    
    // Make API call to create lesson
    makeAuthenticatedRequest('/courses/lessons/create/', {
        method: 'POST',
        body: JSON.stringify(lessonData)
    })
    .then(data => {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        if (data.success) {
            // Close modal
            closeCreateLessonModal();
            
            // Show success message
            showNotification(`Lesson "${data.lesson.title}" created successfully!`, 'success');
            
            // Reload lessons list from API
            loadCourseLessons();
        } else {
            showNotification(data.error || 'Failed to create lesson', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating lesson:', error);
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Show error message
        showNotification('Failed to create lesson. Please try again.', 'error');
    });
}

function editLesson(lessonId) {
    if (!requireAuth('edit lesson')) {
        return;
    }
    
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) {
        alert('Lesson not found');
        return;
    }
    
    // Populate the edit form with lesson data
    document.getElementById('edit-lesson-id').value = lesson.id;
    document.getElementById('edit-lesson-title').value = lesson.title || '';
    document.getElementById('edit-lesson-short-description').value = lesson.short_description || '';
    document.getElementById('edit-lesson-full-text').value = lesson.full_text || '';
    document.getElementById('edit-lesson-order').value = lesson.order || '';
    
    // Add placeholder showing other existing orders
    const orderInput = document.getElementById('edit-lesson-order');
    if (orderInput) {
        const otherOrders = lessons
            .filter(l => l.id !== lessonId)
            .map(l => l.order)
            .sort((a, b) => a - b)
            .join(', ');
        if (otherOrders) {
            orderInput.placeholder = `Other orders: ${otherOrders}`;
        }
    }
    
    // Show the edit modal
    const modal = document.getElementById('editLessonModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus on title input
        setTimeout(() => {
            document.getElementById('edit-lesson-title').focus();
        }, 100);
    }
}

function closeEditLessonModal() {
    const modal = document.getElementById('editLessonModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Clear form
        const form = document.getElementById('editLessonForm');
        if (form) {
            form.reset();
        }
    }
}

function handleUpdateLesson(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const lessonId = parseInt(formData.get('lesson_id'));
    const lessonData = {
        title: formData.get('title'),
        short_description: formData.get('short_description'),
        full_text: formData.get('full_text'),
        order: parseInt(formData.get('order')) || 1
    };
    
    // Basic validation
    if (!lessonData.title || !lessonData.short_description || !lessonData.full_text) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Check if order already exists (excluding current lesson)
    const orderExists = lessons.some(lesson => lesson.order === lessonData.order && lesson.id !== lessonId);
    if (orderExists) {
        showNotification(`Order ${lessonData.order} already exists. Please choose a different order.`, 'error');
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Updating...';
    submitButton.disabled = true;
    
    // Make API call to update lesson
    makeAuthenticatedRequest(`/courses/lessons/${lessonId}/update/`, {
        method: 'PUT',
        body: JSON.stringify(lessonData)
    })
    .then(data => {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        if (data.success) {
            // Close modal
            closeEditLessonModal();
            
            // Show success message
            showNotification(`Lesson "${data.lesson.title}" updated successfully!`, 'success');
            
            // Reload lessons list from API
            loadCourseLessons();
        } else {
            showNotification(data.error || 'Failed to update lesson', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating lesson:', error);
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Show error message
        showNotification('Failed to update lesson. Please try again.', 'error');
    });
}

function deleteLesson(lessonId) {
    if (!requireAuth('delete lesson')) {
        return;
    }
    
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) {
        alert('Lesson not found');
        return;
    }
    
    lessonToDelete = lesson;
    
    // Show lesson info in delete confirmation modal
    const lessonInfoElement = document.getElementById('delete-lesson-info');
    if (lessonInfoElement) {
        lessonInfoElement.textContent = `${lesson.title}`;
    }
    
    // Show delete confirmation modal
    const modal = document.getElementById('deleteLessonConfirmModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeDeleteLessonConfirmModal() {
    const modal = document.getElementById('deleteLessonConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
    lessonToDelete = null;
}

function confirmDeleteLesson() {
    if (!lessonToDelete) return;
    
    const deleteBtn = document.getElementById('confirmDeleteLessonBtn');
    const originalText = deleteBtn.innerHTML;
    const lessonTitle = lessonToDelete.title;
    
    // Show loading state
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    deleteBtn.disabled = true;
    
    // Make authenticated API call to delete lesson
    makeAuthenticatedRequest(`/courses/lessons/${lessonToDelete.id}/delete/`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Close modal
            closeDeleteLessonConfirmModal();
            
            // Show success message
            showNotification(`Lesson "${lessonTitle}" deleted successfully!`, 'success');
            
            // Reload lessons list from API
            loadCourseLessons();
        } else {
            throw new Error(data.error || 'Failed to delete lesson');
        }
    })
    .catch(error => {
        console.error('Error deleting lesson:', error);
        
        // Reset button
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
        
        // Show error message
        showNotification(error.message || 'Failed to delete lesson. Please try again.', 'error');
    });
}

// ==================== SCHEDULE FUNCTIONALITY ====================

// Global variables for schedule
let currentCalendarDate = new Date();
let events = [];
let eventsByDate = {};

// Load schedule page content
function loadScheduleContent() {
    if (!requireAuth('view schedule')) {
        return;
    }
    
    // Initialize calendar
    initializeCalendar();
    
    // Load events
    loadEvents();
    
    // Update stats
    updateEventStats();
}

// Initialize calendar
function initializeCalendar() {
    generateCalendar();
    updateCalendarTitle();
}

// Generate calendar grid
function generateCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    
    generateMonthView();
}

// Generate month view
function generateMonthView() {
    const calendarGrid = document.getElementById('calendar-grid');
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Clear existing content
    calendarGrid.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Adjust startDay to make Monday the first day of the week
    // getDay() returns 0=Sunday, 1=Monday, ..., 6=Saturday
    // We want Monday=0, Tuesday=1, ..., Sunday=6
    let startDay = firstDay.getDay();
    if (startDay === 0) { // Sunday becomes 6
        startDay = 6;
    } else { // Monday=1 becomes 0, Tuesday=2 becomes 1, etc.
        startDay = startDay - 1;
    }
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
        const prevMonthDay = new Date(year, month, -startDay + i + 1);
        const dayCell = createDayCell(prevMonthDay, true);
        calendarGrid.appendChild(dayCell);
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayCell = createDayCell(date, false);
        calendarGrid.appendChild(dayCell);
    }
    
    // Add empty cells for days after month ends
    const remainingCells = 42 - (startDay + daysInMonth); // 6 weeks * 7 days
    for (let i = 1; i <= remainingCells; i++) {
        const nextMonthDay = new Date(year, month + 1, i);
        const dayCell = createDayCell(nextMonthDay, true);
        calendarGrid.appendChild(dayCell);
    }
}


// Create day cell for month view
function createDayCell(date, isOtherMonth) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayCell.classList.add('other-month');
    }
    
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayCell.classList.add('today');
    }
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayCell.appendChild(dayNumber);
    
    // Check if this day has events
    const dateKey = formatDateKey(date);
    const dayEvents = eventsByDate[dateKey] || [];
    
    if (dayEvents.length > 0) {
        dayCell.classList.add('has-events');
        
        // Add event count badge
        const eventCount = document.createElement('div');
        eventCount.className = 'day-event-count';
        eventCount.textContent = dayEvents.length;
        dayCell.appendChild(eventCount);
        
        // Add first few events
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events';
        
        dayEvents.slice(0, 3).forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `day-event ${event.priority}-priority`;
            eventElement.textContent = event.title;
            eventElement.title = `${event.title} - ${event.start_time || 'All day'}`;
            eventsContainer.appendChild(eventElement);
        });
        
        dayCell.appendChild(eventsContainer);
    }
    
    // Add click handler
    dayCell.addEventListener('click', () => {
        showDayEventsModal(date);
    });
    
    return dayCell;
}


// Format date key for events lookup
function formatDateKey(date) {
    return date.toISOString().split('T')[0];
}

// Update calendar title
function updateCalendarTitle() {
    const titleElement = document.getElementById('calendar-month-year');
    if (!titleElement) return;
    
    const monthName = currentCalendarDate.toLocaleDateString('en-US', { month: 'long' });
    const year = currentCalendarDate.getFullYear();
    titleElement.textContent = `${monthName} ${year}`;
}

// Navigate calendar
function navigateCalendar(direction) {
    if (direction === 'prev') {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    } else {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    }
    
    generateCalendar();
    updateCalendarTitle();
}


// Toggle time fields based on All Day Event checkbox
function toggleTimeFields(mode) {
    const isAllDay = document.getElementById(`${mode}-event-all-day`).checked;
    const startTimeField = document.getElementById(`${mode}-event-start-time`);
    const endTimeField = document.getElementById(`${mode}-event-end-time`);
    const timeRow = startTimeField.closest('.form-row');
    
    if (isAllDay) {
        // Hide time fields when All Day Event is checked
        timeRow.style.display = 'none';
        startTimeField.value = '';
        endTimeField.value = '';
    } else {
        // Show time fields when All Day Event is unchecked
        timeRow.style.display = 'grid';
    }
}


function loadSettingsContent() {
    loadUserProfile();
}

// Load user profile data
function loadUserProfile() {
    makeAuthenticatedRequest('/users/profile/', {
        method: 'GET'
    })
    .then(data => {
        if (data.success && data.user) {
            populateSettingsForm(data.user);
        } else {
            throw new Error(data.error || 'Failed to load profile');
        }
    })
    .catch(error => {
        console.error('Error loading user profile:', error);
        showNotification('Failed to load profile data. Please try again.', 'error');
    });
}

// Populate settings form with user data
function populateSettingsForm(user) {
    document.getElementById('settings-first-name').value = user.first_name || '';
    document.getElementById('settings-last-name').value = user.last_name || '';
    document.getElementById('settings-father-name').value = user.father_name || '';
    document.getElementById('settings-date-of-birth').value = user.date_of_birth || '';
    document.getElementById('settings-email').value = user.email || '';
    document.getElementById('settings-phone').value = user.phone_number || '';
    document.getElementById('settings-role').value = user.role || 'student';
    document.getElementById('settings-is-active').checked = user.is_active || false;
}

// Handle profile update
function handleUpdateProfile() {
    const form = document.getElementById('settingsForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const profileData = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        father_name: formData.get('father_name'),
        date_of_birth: formData.get('date_of_birth'),
        phone_number: formData.get('phone_number'),
        is_active: document.getElementById('settings-is-active').checked
    };
    
    // Basic validation
    if (!profileData.first_name || !profileData.last_name) {
        showNotification('First name and last name are required.', 'error');
        return;
    }
    
    const updateBtn = document.querySelector('#settingsForm .btn-primary');
    const originalText = updateBtn.innerHTML;
    
    // Show loading state
    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    updateBtn.disabled = true;
    
    makeAuthenticatedRequest('/users/profile/', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
    })
    .then(data => {
        if (data.success) {
            showNotification('Profile updated successfully!', 'success');
            // Update user data in localStorage
            const currentUser = getCurrentUser();
            if (currentUser) {
                Object.assign(currentUser, profileData);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
        } else {
            throw new Error(data.error || 'Failed to update profile');
        }
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        showNotification(error.message || 'Failed to update profile. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button
        updateBtn.innerHTML = originalText;
        updateBtn.disabled = false;
    });
}

// Handle password change
function handleChangePassword() {
    const form = document.getElementById('changePasswordForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const passwordData = {
        current_password: formData.get('current_password'),
        new_password: formData.get('new_password'),
        confirm_password: formData.get('confirm_password')
    };
    
    // Basic validation
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
        showNotification('All password fields are required.', 'error');
        return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
        showNotification('New passwords do not match.', 'error');
        return;
    }
    
    if (passwordData.new_password.length < 8) {
        showNotification('New password must be at least 8 characters long.', 'error');
        return;
    }
    
    const changeBtn = document.querySelector('#changePasswordForm .btn-primary');
    const originalText = changeBtn.innerHTML;
    
    // Show loading state
    changeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
    changeBtn.disabled = true;
    
    makeAuthenticatedRequest('/users/change-password/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData)
    })
    .then(data => {
        if (data.success) {
            showNotification('Password changed successfully!', 'success');
            form.reset();
        } else {
            throw new Error(data.error || 'Failed to change password');
        }
    })
    .catch(error => {
        console.error('Error changing password:', error);
        showNotification(error.message || 'Failed to change password. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button
        changeBtn.innerHTML = originalText;
        changeBtn.disabled = false;
    });
}

// Reset settings form
function resetSettingsForm() {
    loadUserProfile();
}

// Reset password form
function resetPasswordForm() {
    document.getElementById('changePasswordForm').reset();
}


// Load events from API
function loadEvents() {
    makeAuthenticatedRequest('/schedule/events/')
        .then(data => {
            if (data.success) {
                events = data.events || [];
                organizeEventsByDate();
                generateCalendar();
                updateEventStats();
            } else {
                throw new Error(data.error || 'Failed to load events');
            }
        })
        .catch(error => {
            console.error('Error loading events:', error);
            showNotification('Failed to load events. Please try again.', 'error');
        });
}

// Organize events by date
function organizeEventsByDate() {
    eventsByDate = {};
    events.forEach(event => {
        const dateKey = event.assigned_date;
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
    });
    
    // Sort events by start time within each date
    Object.keys(eventsByDate).forEach(dateKey => {
        eventsByDate[dateKey].sort((a, b) => {
            if (!a.start_time && !b.start_time) return 0;
            if (!a.start_time) return 1;
            if (!b.start_time) return -1;
            return a.start_time.localeCompare(b.start_time);
        });
    });
}

// Update event statistics
function updateEventStats() {
    const totalEvents = events.length;
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = eventsByDate[today] || [];
    
    // Calculate week events (next 7 days)
    const weekEvents = events.filter(event => {
        const eventDate = new Date(event.assigned_date);
        const today = new Date();
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return eventDate >= today && eventDate <= weekFromNow;
    });
    
    // Calculate user's events
    const currentUser = getCurrentUser();
    const myEvents = events.filter(event => event.creator.id === currentUser?.id);
    
    // Update stat cards
    updateStatCard('total-events', totalEvents);
    updateStatCard('today-events', todayEvents.length);
    updateStatCard('week-events', weekEvents.length);
    updateStatCard('my-events', myEvents.length);
}

// Update stat card
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// Show day events modal
function showDayEventsModal(date) {
    const modal = document.getElementById('dayEventsModal');
    const titleElement = document.getElementById('day-events-title');
    const eventsListElement = document.getElementById('day-events-list');
    
    if (!modal || !titleElement || !eventsListElement) return;
    
    const dateKey = formatDateKey(date);
    const dayEvents = eventsByDate[dateKey] || [];
    
    // Update title
    const dateString = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    titleElement.textContent = `Events for ${dateString}`;
    
    // Clear existing events
    eventsListElement.innerHTML = '';
    
    if (dayEvents.length === 0) {
        eventsListElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-day"></i>
                <p>No events scheduled for this day</p>
            </div>
        `;
    } else {
        dayEvents.forEach(event => {
            const eventElement = createEventElement(event);
            eventsListElement.appendChild(eventElement);
        });
    }
    
    // Store current date for create event modal
    modal.dataset.selectedDate = dateKey;
    
    // Show modal
    modal.style.display = 'block';
}

// Create event element for display
function createEventElement(event) {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'event-item';
    
    const timeDisplay = event.start_time ? 
        `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}` : 
        'All day';
    
    const priorityClass = event.priority || 'medium';
    
    eventDiv.innerHTML = `
        <div class="event-header">
            <div class="event-title">${event.title}</div>
            <div class="event-time">${timeDisplay}</div>
        </div>
        ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
        <div class="event-meta">
            <span class="event-type-badge">${event.event_type}</span>
            <span class="event-priority-badge ${priorityClass}">${event.priority}</span>
            ${event.location ? `<span class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</span>` : ''}
        </div>
        <div class="event-actions">
            <button class="btn-edit" onclick="editEvent(${event.id})">Edit</button>
            <button class="btn-delete" onclick="deleteEvent(${event.id})">Delete</button>
        </div>
    `;
    
    return eventDiv;
}

// Show create event modal
function showCreateEventModal() {
    const modal = document.getElementById('createEventModal');
    const form = document.getElementById('createEventForm');
    
    if (!modal || !form) return;
    
    // Reset form
    form.reset();
    
    // Set default date if coming from day events modal
    const dayEventsModal = document.getElementById('dayEventsModal');
    if (dayEventsModal && dayEventsModal.dataset.selectedDate) {
        const dateInput = document.getElementById('create-event-date');
        if (dateInput) {
            dateInput.value = dayEventsModal.dataset.selectedDate;
        }
    } else {
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('create-event-date');
        if (dateInput) {
            dateInput.value = today;
        }
    }
    
    // Close day events modal if open
    if (dayEventsModal) {
        dayEventsModal.style.display = 'none';
    }
    
    // Show modal
    modal.style.display = 'block';
    
    // Initialize time fields visibility
    toggleTimeFields('create');
    
    // Focus on title input
    setTimeout(() => {
        const titleInput = document.getElementById('create-event-title');
        if (titleInput) {
            titleInput.focus();
        }
    }, 100);
}

// Close create event modal
function closeCreateEventModal() {
    const modal = document.getElementById('createEventModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle create event
function handleCreateEvent() {
    const form = document.getElementById('createEventForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        assigned_date: formData.get('assigned_date'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
        event_type: formData.get('event_type'),
        priority: formData.get('priority'),
        location: formData.get('location'),
        is_all_day: formData.get('is_all_day') === 'on'
    };
    
    // Validate required fields
    if (!eventData.title || !eventData.assigned_date) {
        showNotification('Title and date are required', 'error');
        return;
    }
    
    // Validate time logic
    if (eventData.start_time && eventData.end_time && eventData.end_time <= eventData.start_time) {
        showNotification('End time must be after start time', 'error');
        return;
    }
    
    // Make API call
    makeAuthenticatedRequest('/schedule/events/create/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
    })
    .then(data => {
        if (data.success) {
            showNotification('Event created successfully!', 'success');
            closeCreateEventModal();
            loadEvents(); // Reload events
        } else {
            throw new Error(data.error || 'Failed to create event');
        }
    })
    .catch(error => {
        console.error('Error creating event:', error);
        showNotification(error.message || 'Failed to create event. Please try again.', 'error');
    });
}

// Edit event
function editEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) {
        showNotification('Event not found', 'error');
        return;
    }
    
    const modal = document.getElementById('editEventModal');
    const form = document.getElementById('editEventForm');
    
    if (!modal || !form) return;
    
    // Populate form with event data
    document.getElementById('edit-event-id').value = event.id;
    document.getElementById('edit-event-title').value = event.title;
    document.getElementById('edit-event-description').value = event.description || '';
    document.getElementById('edit-event-date').value = event.assigned_date;
    document.getElementById('edit-event-start-time').value = event.start_time || '';
    document.getElementById('edit-event-end-time').value = event.end_time || '';
    document.getElementById('edit-event-type').value = event.event_type;
    document.getElementById('edit-event-priority').value = event.priority;
    document.getElementById('edit-event-location').value = event.location || '';
    document.getElementById('edit-event-all-day').checked = event.is_all_day;
    
    // Close day events modal if open
    const dayEventsModal = document.getElementById('dayEventsModal');
    if (dayEventsModal) {
        dayEventsModal.style.display = 'none';
    }
    
    // Show modal
    modal.style.display = 'block';
    
    // Initialize time fields visibility
    toggleTimeFields('edit');
    
    // Focus on title input
    setTimeout(() => {
        const titleInput = document.getElementById('edit-event-title');
        if (titleInput) {
            titleInput.focus();
        }
    }, 100);
}

// Close edit event modal
function closeEditEventModal() {
    const modal = document.getElementById('editEventModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle update event
function handleUpdateEvent() {
    const form = document.getElementById('editEventForm');
    if (!form) return;
    
    const eventId = document.getElementById('edit-event-id').value;
    const formData = new FormData(form);
    const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        assigned_date: formData.get('assigned_date'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
        event_type: formData.get('event_type'),
        priority: formData.get('priority'),
        location: formData.get('location'),
        is_all_day: formData.get('is_all_day') === 'on'
    };
    
    // Validate required fields
    if (!eventData.title || !eventData.assigned_date) {
        showNotification('Title and date are required', 'error');
        return;
    }
    
    // Validate time logic
    if (eventData.start_time && eventData.end_time && eventData.end_time <= eventData.start_time) {
        showNotification('End time must be after start time', 'error');
        return;
    }
    
    // Make API call
    makeAuthenticatedRequest(`/schedule/events/${eventId}/update/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
    })
    .then(data => {
        if (data.success) {
            showNotification('Event updated successfully!', 'success');
            closeEditEventModal();
            loadEvents(); // Reload events
        } else {
            throw new Error(data.error || 'Failed to update event');
        }
    })
    .catch(error => {
        console.error('Error updating event:', error);
        showNotification(error.message || 'Failed to update event. Please try again.', 'error');
    });
}

// Delete event
function deleteEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) {
        showNotification('Event not found', 'error');
        return;
    }
    
    const modal = document.getElementById('deleteEventConfirmModal');
    const previewElement = document.getElementById('delete-event-preview');
    
    if (!modal || !previewElement) return;
    
    // Show event preview
    previewElement.innerHTML = `
        <div class="event-title">${event.title}</div>
        <div class="event-meta">${event.assigned_date} ${event.start_time || 'All day'}</div>
    `;
    
    // Store event ID for deletion
    modal.dataset.eventId = eventId;
    
    // Close day events modal if open
    const dayEventsModal = document.getElementById('dayEventsModal');
    if (dayEventsModal) {
        dayEventsModal.style.display = 'none';
    }
    
    // Show modal
    modal.style.display = 'block';
}

// Close delete event confirmation modal
function closeDeleteEventConfirmModal() {
    const modal = document.getElementById('deleteEventConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Confirm delete event
function confirmDeleteEvent() {
    const modal = document.getElementById('deleteEventConfirmModal');
    const eventId = modal.dataset.eventId;
    
    if (!eventId) {
        showNotification('Event ID not found', 'error');
        return;
    }
    
    const deleteBtn = document.getElementById('confirmDeleteEventBtn');
    const originalText = deleteBtn.innerHTML;
    const event = events.find(e => e.id == eventId);
    const eventTitle = event ? event.title : 'Event';
    
    // Show loading state
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    deleteBtn.disabled = true;
    
    // Make authenticated API call to delete event
    makeAuthenticatedRequest(`/schedule/events/${eventId}/delete/`, {
        method: 'DELETE'
    })
    .then(data => {
        if (data.success) {
            // Reset button
            deleteBtn.innerHTML = originalText;
            deleteBtn.disabled = false;
            
            // Close modal
            closeDeleteEventConfirmModal();
            
            // Show success message
            showNotification(`Event "${eventTitle}" deleted successfully!`, 'success');
            
            // Navigate back to schedule page
            navigateTo('schedule');
        } else {
            throw new Error(data.error || 'Failed to delete event');
        }
    })
    .catch(error => {
        console.error('Error deleting event:', error);
        
        // Reset button
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
        
        // Show error message
        showNotification(error.message || 'Failed to delete event. Please try again.', 'error');
    });
}

// Close day events modal
function closeDayEventsModal() {
    const modal = document.getElementById('dayEventsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        navigateTo,
        showPage,
        showLoginModal,
        closeLoginModal,
        logout,
        showNotification,
        API
    };
}
