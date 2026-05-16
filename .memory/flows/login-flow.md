---
id: flow/login-flow
type: flow
summary: 用户名密码登录流程：接收凭据 → 校验 → 签发 JWT → 返回令牌
tags: [auth, login, jwt]
status: stable
created: 2026-05-12
lastModified: 2026-05-12
steps:
  - order: 1
    component: component/login-controller
    description: 接收 POST /auth/login 请求，解析用户名密码
  - order: 2
    component: component/password-validator
    description: 校验密码强度和格式
  - order: 3
    component: component/token-service
    description: 调用 TokenService 签发 JWT
trigger: 用户访问登录页面
result: 返回 access_token 和 refresh_token
---

# 用户登录流程

标准的用户名密码认证流程，通过 JWT 返回令牌。
