# Stage 1: Build the app with node:alpine
FROM node:21-alpine AS build

# Set the working directory
WORKDIR /src

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install --production && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Stage 2: Final image with only the necessary files
FROM node:21-alpine

# Set the working directory
WORKDIR /src

# Copy only necessary files from the build stage
COPY --from=build /src /src

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]
