# Use a Node.js base image
FROM node AS build

# Set the working directory
WORKDIR /app

# Copy the application code
COPY . .

## replace backend URL with a variable 
RUN sed -i -E "s|(var DOMAIN = 'https://)[^']*('.*)|\1BACKEND_URL_HERE\2|" app/scripts/app.js
RUN sed -i -E "s|(const DOMAIN = 'https://)[^']*('.*)|\1BACKEND_URL_HERE\2|" app/scripts/app.ts
RUN sed -i -E "s|(server: 'https://)[^/']*|server: 'https://BACKEND_URL_HERE|" app/scripts/services/huashan.service.js
RUN sed -i -E "s|(server: 'https://)[^/']*|server: 'https://BACKEND_URL_HERE|" app/scripts/services/huashan.service.ts

# Install dependencies
RUN npm install
RUN npm run postinstall

# Build the Angular application
RUN npm run build

# Stage 2: Use an NGINX image to serve the built application
FROM nginx

# Copy the built application from the previous stage to the NGINX html folder
COPY --from=build /app/dist/ /usr/share/nginx/html

# Expose port 80
EXPOSE 80


#to start the container and replace the backend server path commands are in docker-compose file in infra repo
