FROM node:24-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install --global pnpm@11.25.0 && pnpm install --prod --frozen-lockfile --ignore-scripts
COPY *.js *.css *.html manifest.webmanifest ./
COPY assets ./assets
ADD --checksum=sha256:5039225b9a4ac3df55f185d24b7a92d640c86cc4747002d7f23351e394de03a6 https://huggingface.co/Ko033/isnet-general-use-onnx/resolve/5349b617911fd60c619b52f32e2b593517b78df3/onnx/model_quantized.onnx /app/assets/garment-model.onnx
RUN chmod 644 /app/assets/garment-model.onnx
ENV NODE_ENV=production
ENV PORT=8787
ENV DATA_DIR=/data
EXPOSE 8787
CMD ["node","server.js"]
