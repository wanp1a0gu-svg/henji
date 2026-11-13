# ============================================================================
# 痕迹 Traces · 运行镜像
# ============================================================================
# server.js 是零依赖 Node 服务（只用内置模块），所以镜像里不装任何 npm 包，
# 体积小、构建快，也不存在依赖漏洞扫描的问题。
#
# ⚠️ 不要把 server-config.json 打进镜像：密钥一律走环境变量（见 .env.example）。
# ============================================================================
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# server.js 与它 require 的本地模块
COPY server.js ./
COPY lib ./lib

# 静态站点（next export 的产物，由 server.js 直接托管）
COPY release ./release

# PayPal 事件日志目录（服务启动时不会自建，先建好）
RUN mkdir -p /app/data

EXPOSE 3000

# 健康检查：host 平台据此判断是否就绪
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
