---
id: system/auth-system
type: system
summary: 认证授权系统，负责用户登录、JWT 令牌管理、权限校验
tags: [auth, security, core]
status: stable
created: 2026-05-10
lastModified: 2026-05-15
relates: [flow/login-flow, component/token-service, config/jwt-secret, api/auth-login]
---

# 认证系统

项目的核心认证模块，基于 JWT 无状态认证方案。

## 功能
- 用户名密码登录
- JWT 签发与验证
- Token 自动刷新
- RBAC 权限校验
