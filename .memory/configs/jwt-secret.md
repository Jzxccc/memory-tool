---
id: config/jwt-secret
type: config
summary: JWT RS256 签名私钥，用于签发和验证令牌
tags: [jwt, security, secret]
status: stable
created: 2026-05-10
lastModified: 2026-05-10
key: JWT_PRIVATE_KEY
envType: secret
required: true
---

# JWT_PRIVATE_KEY

RS256 算法签名的私钥。

## 说明
- 本地开发使用 `./keys/private.pem`
- 生产环境注入环境变量
- 对应公钥暴露于 `/.well-known/jwks.json`
