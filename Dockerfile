FROM node:24-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install --global pnpm@11.25.0 && pnpm install --prod --frozen-lockfile --ignore-scripts
COPY *.js *.css *.html manifest.webmanifest ./
COPY assets ./assets
ENV NODE_ENV=production
ENV PORT=8787
ENV DATA_DIR=/data
EXPOSE 8787
CMD ["node","server.js"]
