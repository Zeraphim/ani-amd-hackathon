# Root Dockerfile — builds the Next.js web tier (web/) for Hugging Face Spaces.
# HF Spaces routes the public URL to app_port (7860, set in README.md front-matter).

FROM node:20-slim AS builder
WORKDIR /app
COPY web/package.json ./
RUN npm install
COPY web/ ./
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7860
ENV HOSTNAME=0.0.0.0
# Next.js "standalone" output: a minimal self-contained server.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 7860
CMD ["node", "server.js"]
