# ConnectSphere
ConnectSphere is a full-stack, single-page web application inspired by professional networking platforms like LinkedIn. It allows users to register, log in, create posts, and view a feed of all posts from other users.

# Tech Stack
Backend
Runtime: Node.js

Framework: Express.js

Database: PostgreSQL

ORM: Sequelize

Authentication: JSON Web Tokens (JWT)

Password Hashing: Bcrypt.js

Frontend
Library: React

Language: JavaScript (ES6+) & JSX

Styling: CSS-in-JS

Routing: Custom hash-based routing

Project Setup
To run this project locally, you will need to set up both the backend server and the frontend client.

Prerequisites
Node.js and npm installed

A PostgreSQL database instance running locally or on the cloud

1. Backend Setup
The backend server connects to the database and provides the API for the frontend.

Navigate to the backend directory:

cd path/to/your/backend-folder

Install dependencies:

npm install

Create an environment file:
Create a file named .env in the root of the backend directory and add the following variables.

# .env

# Your PostgreSQL connection string
# Example: postgres://USER:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="your_postgresql_connection_string_here"

# A strong, random string for signing JWTs
JWT_SECRET="your_super_secret_and_long_random_string_here"

Start the server:

npm start

The server should now be running, typically on http://localhost:5001.

2. Frontend Setup
The frontend is a React application that consumes the backend API.

Navigate to the frontend directory:

cd path/to/your/frontend-folder

Install dependencies:

npm install

Create an environment file:
Create a file named .env in the root of the frontend directory. This tells your React app where to find the backend API.

# .env

# The URL of your running backend server
REACT_APP_API_URL=http://localhost:5001

Start the client:

npm start

Your React application should open in your browser, typically at http://localhost:3000.

# Demo Users
You can register a new account or use the following credentials to log in and test the <b>hosted</b> application:

Email: test@test.com
Password: 1234

Email: test@test2.com
Password: 1234

Email: test@test3.com
Password: 1234