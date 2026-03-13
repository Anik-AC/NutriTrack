# NutriTrack

## Project Overview
NutriTrack is a MERN stack web application that helps users track their nutritional intake and achieve their fitness goals. This project consists of a **React frontend**, a **Node.js/Express backend**, and a **MongoDB database**.

---

## Getting Started
Follow these instructions to set up and run the project for development and deployment.

---

## Pre-Requisites
The `.env` file is not present in this repository. Please create a `.env` file in the root directory with the following:

```
MONGO_URI=mongodb+srv://<username>:<password>@cluster01.iwhtf.mongodb.net/NutriTrack?retryWrites=true&w=majority&appName=Cluster01
PORT=7000
```

Please replace `<username>` and `<password>` with your actual MongoDB credentials before use.

---

## Running the Project

### **Development Mode**
For development, run:
```sh
npm run dev
```
This starts the backend using **Nodemon** for live reload. 

If you are running this in a Windows Environment, run the following code first:
```sh
 npm install -g cross-env
```

To run only the frontend separately:
```sh
cd NutriTrack-Frontend
npm run dev
```

### **Production Mode (Deployment)**
To build and start the project in production mode, run:
```sh
npm run build
npm start
```
This:
1. Installs all necessary dependencies.
2. Builds the frontend.
3. Starts the backend in production mode.

---

## Git Commands
All necessary Git commands for working with this repository are listed in the `git_commands.txt` file.

Make sure to check this file for the correct workflow when pulling, pushing, and managing branches.

---
For any questions, refer to the project documentation or contact the team!





