INSERT INTO permissions (name, key, method, url, description, created_at, updated_at) VALUES
('Danh sách người dùng', 'USER_VIEW_LIST_USER', 'GET', '/api/user-service/users', 'Danh sách người dùng', NOW(), NOW()),
('Tạo tài khoản hộ', 'USER_CREATE_USER', 'POST', '/api/user-service/users', 'Tạo tài khoản hộ', NOW(), NOW()),

('Danh sách role', 'USER_VIEW_LIST_ROLE', 'GET', '/api/user-service/roles', 'Danh sách role', NOW(), NOW()),
('Tạo role', 'USER_CREATE_ROLE', 'POST', '/api/user-service/roles', 'Tạo role', NOW(), NOW()),
('Sửa role', 'USER_UPDATE_ROLE', 'PUT', '/api/user-service/roles/:id', 'Sửa role', NOW(), NOW()),
('Xoá role', 'USER_DELETE_ROLE', 'DELETE', '/api/user-service/roles/:id', 'Xoá role', NOW(), NOW()),

('Danh sách permission', 'USER_VIEW_LIST_PERMISSION', 'GET', '/api/user-service/permissions', 'Danh sách permission', NOW(), NOW()),

('Danh sách role_permission', 'USER_VIEW_LIST_ROLE_PERMISSION', 'GET', '/api/user-service/role-permissions', 'Danh sách role_permission', NOW(), NOW()),
('Tạo role_permission', 'USER_CREATE_ROLE_PERMISSION', 'POST', '/api/user-service/role-permissions', 'Tạo role_permission', NOW(), NOW()),
('Xoá role_permission', 'USER_DELETE_ROLE_PERMISSION', 'DELETE', '/api/user-service/role-permissions/:id', 'Xoá role_permission', NOW(), NOW()),
('Danh sách project', 'CORE_VIEW_LIST_PROJECT', 'GET', '/api/core-service/projects', 'Danh sách project', NOW(), NOW()),
('Tạo project', 'CORE_CREATE_PROJECT', 'POST', '/api/core-service/projects', 'Tạo project', NOW(), NOW()),
('Sửa project', 'CORE_UPDATE_PROJECT', 'PUT', '/api/core-service/projects/:id', 'Sửa project', NOW(), NOW()),
('Xoá project', 'CORE_DELETE_PROJECT', 'DELETE', '/api/core-service/projects/:id', 'Xoá project', NOW(), NOW()),

('Danh sách issue (backlog)', 'CORE_VIEW_LIST_ISSUE', 'GET', '/api/core-service/issues', 'Danh sách issue (backlog)', NOW(), NOW()),
('Chi tiết issue', 'CORE_VIEW_DETAIL_ISSUE', 'GET', '/api/core-service/issues/:id', 'Chi tiết issue', NOW(), NOW()),
('Tạo issue', 'CORE_CREATE_ISSUE', 'POST', '/api/core-service/issues', 'Tạo issue', NOW(), NOW()),
('Sửa issue', 'CORE_UPDATE_ISSUE', 'PUT', '/api/core-service/issues/:id', 'Sửa issue', NOW(), NOW()),

('Thêm attachment', 'CORE_CREATE_ATTACHMENT', 'POST', '/api/core-service/attachments', 'Thêm attachment', NOW(), NOW()),
('Xoá attachment', 'CORE_DELETE_ATTACHMENT', 'DELETE', '/api/core-service/attachments/:id', 'Xoá attachment', NOW(), NOW()),

('Thêm sub-task', 'CORE_CREATE_SUBTASK', 'POST', '/api/core-service/subtasks', 'Thêm sub-task', NOW(), NOW()),
('Sửa sub-task', 'CORE_UPDATE_SUBTASK', 'PUT', '/api/core-service/subtasks/:id', 'Sửa sub-task', NOW(), NOW()),
('Xoá sub-task', 'CORE_DELETE_SUBTASK', 'DELETE', '/api/core-service/subtasks/:id', 'Xoá sub-task', NOW(), NOW()),

('Tạo comment', 'CORE_CREATE_COMMENT', 'POST', '/api/core-service/comments', 'Tạo comment', NOW(), NOW()),
('Sửa comment', 'CORE_UPDATE_COMMENT', 'PUT', '/api/core-service/comments/:id', 'Sửa comment', NOW(), NOW()),
('Xoá comment', 'CORE_DELETE_COMMENT', 'DELETE', '/api/core-service/comments/:id', 'Xoá comment', NOW(), NOW()),

('Gán issue vào sprint', 'CORE_ASSIGN_ISSUE_SPRINT', 'POST', '/api/core-service/sprints/:sprintId/issues/:issueId', 'Gán issue vào sprint', NOW(), NOW()),

('Danh sách sprint', 'CORE_VIEW_LIST_SPRINT', 'GET', '/api/core-service/sprints', 'Danh sách sprint', NOW(), NOW()),
('Tạo sprint', 'CORE_CREATE_SPRINT', 'POST', '/api/core-service/sprints', 'Tạo sprint', NOW(), NOW()),
('Sửa sprint', 'CORE_UPDATE_SPRINT', 'PUT', '/api/core-service/sprints/:id', 'Sửa sprint', NOW(), NOW()),
('Xoá sprint', 'CORE_DELETE_SPRINT', 'DELETE', '/api/core-service/sprints/:id', 'Xoá sprint', NOW(), NOW()),

('Danh sách board', 'CORE_VIEW_LIST_BOARD', 'GET', '/api/core-service/boards', 'Danh sách board', NOW(), NOW()),
('Chi tiết scrum board', 'CORE_VIEW_DETAIL_BOARD', 'GET', '/api/core-service/boards/:id', 'Chi tiết scrum board', NOW(), NOW()),

('Thêm cột', 'CORE_CREATE_BOARD_COLUMN', 'POST', '/api/core-service/board-columns', 'Thêm cột', NOW(), NOW()),
('Sửa cột', 'CORE_UPDATE_BOARD_COLUMN', 'PUT', '/api/core-service/board-columns/:id', 'Sửa cột', NOW(), NOW()),
('Xoá cột', 'CORE_DELETE_BOARD_COLUMN', 'DELETE', '/api/core-service/board-columns/:id', 'Xoá cột', NOW(), NOW()),

('Kéo thả đổi trạng thái issue', 'CORE_UPDATE_ISSUE_STAGE', 'POST', '/api/core-service/issues/:id/transition', 'Kéo thả đổi trạng thái issue', NOW(), NOW()),

('Danh sách workflow', 'CORE_VIEW_LIST_WORKFLOW', 'GET', '/api/core-service/workflows', 'Danh sách workflow', NOW(), NOW()),
('Sửa workflow', 'CORE_UPDATE_WORKFLOW', 'PUT', '/api/core-service/workflows/:id', 'Sửa workflow', NOW(), NOW()),

('Danh sách user trong project', 'CORE_VIEW_LIST_PROJECT_USER', 'GET', '/api/core-service/project-users', 'Danh sách user trong project', NOW(), NOW()),
('Gán user vào project', 'CORE_CREATE_PROJECT_USER', 'POST', '/api/core-service/project-users', 'Gán user vào project', NOW(), NOW()),
('Sửa project_user', 'CORE_UPDATE_PROJECT_USER', 'PUT', '/api/core-service/project-users/:id', 'Sửa project_user', NOW(), NOW()),
('Gỡ user khỏi project', 'CORE_DELETE_PROJECT_USER', 'DELETE', '/api/core-service/project-users/:id', 'Gỡ user khỏi project', NOW(), NOW()),

('Danh sách release', 'CORE_VIEW_LIST_RELEASE', 'GET', '/api/core-service/releases', 'Danh sách release', NOW(), NOW()),
('Tạo release', 'CORE_CREATE_RELEASE', 'POST', '/api/core-service/releases', 'Tạo release', NOW(), NOW()),
('Sửa release', 'CORE_UPDATE_RELEASE', 'PUT', '/api/core-service/releases/:id', 'Sửa release', NOW(), NOW()),
('Xoá release', 'CORE_DELETE_RELEASE', 'DELETE', '/api/core-service/releases/:id', 'Xoá release', NOW(), NOW());

Select * from permissions