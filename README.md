# Digital document archive system

This project is a document archive system built using the MERN stack, encompassing both the backend and frontend.

The goal is to develop a practical and efficient application tailored for small businesses in Serbia. The system will enable businesses to archive documents in digital form, ensuring compliance with new state regulations.

This solution aims to simplify document management, providing small businesses with a user-friendly tool to organize, store, and access critical records digitally.

The solution is designed to be highly flexible, allowing deployment either in the cloud or on a local server which small companies already own, ensuring that expenses remain low while effectively addressing their document management needs.

![Opera Snapshot_2025-01-26_220155_localhost](https://github.com/user-attachments/assets/2caaa0d2-33a0-4219-a8c3-be149b72e453)

![Opera Snapshot_2025-01-26_222951_localhost](https://github.com/user-attachments/assets/f7305a7e-405e-4a7d-81a0-5d51c471831e)

## Setup
To configure the application, you need .env files in frontend and backend.

1. **.env for backend**  
   ```.env
   PORT = 5001
   
   DISK = S
   
   MONGO_LOCAL_URL = mongodb://127.0.0.1:27017/dms
   
   PASS_SEC = dms
   
   JWT_SEC = dms
   ```

2. **.env for frontned**  
   ```.env
   REACT_APP_SERVER_URL = http://localhost:5001/api/
   ```

## Running the Application
To run the application, use the following command:  
```bash
cd DMSback
npm install
npm start
cd ..
cd DMSfront
npm install
npm start
```
 
