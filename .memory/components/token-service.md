---
id: component/token-service
type: component
summary: JWT 令牌的签发、验证和自动刷新服务
tags: [jwt, token, auth]
status: stable
created: 2026-05-10
lastModified: 2026-05-15
filePath: src/auth/token-service.ts
language: typescript
exports: [issueToken, verifyToken, refreshToken]
depends_on: [config/jwt-secret]
relates: [flow/login-flow, api/auth-login]
---

# TokenService

负责 JWT 令牌的生命周期管理。

## 导出函数
- `issueToken(userId, claims)` → `{ access_token, refresh_token }`
- `verifyToken(token)` → `claims | null`
- `refreshToken(refreshToken)` → `{ access_token, refresh_token }`

## 关键逻辑
- access_token 有效期 15 分钟，使用 RS256 签名
- refresh_token 有效期 7 天，存储在 httpOnly cookie
- 公钥通过 `/.well-known/jwks.json` 暴露
