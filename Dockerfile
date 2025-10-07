# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install all dependencies (including devDependencies for the build step)
RUN npm install

# Copy the rest of the application code
COPY . .

# Run the build script to generate the production assets
RUN npm run build

# The port the application will run on
EXPOSE 3000

# The command to start the application
CMD ["npm", "start"]