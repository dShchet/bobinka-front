FROM node:latest

ENV PATH="${PROJECT_PATH:-/usr/src/app}/web_app/node_modules/.bin:$PATH"

WORKDIR "${PROJECT_PATH:-/usr/src/app}/web_app"

COPY ./package*.json "${PROJECT_PATH:-/usr/src/app}/web_app/"

RUN npm install  # --production (when webapp will be hosted via nginx)

COPY ./ "${PROJECT_PATH:-/usr/src/app}/web_app"

COPY ./.env ${PROJECT_PATH:-/usr/src/app}

EXPOSE ${VITE_PORT}

RUN npm run build

CMD ["npm", "run", "preview"]
