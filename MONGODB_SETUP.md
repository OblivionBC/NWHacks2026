# MongoDB Atlas Setup Guide

Follow these steps to set up MongoDB Atlas (free cloud database) for your Idea Chat app.

## Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Verify your email

## Step 2: Create a Free Cluster

1. After logging in, click **"Build a Database"**
2. Choose **M0 FREE** tier (perfect for development)
3. Choose a cloud provider and region (pick one close to you)
4. Click **"Create Cluster"** (takes 3-5 minutes)

## Step 3: Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `ideachat` (or whatever you want)
5. Click **"Autogenerate Secure Password"** and SAVE IT
6. Under "Database User Privileges", select **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Allow Network Access

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - This adds `0.0.0.0/0` to the whitelist
   - For production, you'd use specific IPs
4. Click **"Confirm"**

## Step 5: Get Connection String

1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Drivers"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update Your .env File

1. Open `server/.env`
2. Replace the placeholders in your connection string:
   - Replace `<username>` with your database username
   - Replace `<password>` with the password you saved
3. Add to your `.env` file:
   ```
   MONGODB_URI=mongodb+srv://ideachat:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ideachat?retryWrites=true&w=majority
   ```

Example:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
PORT=3001
MONGODB_URI=mongodb+srv://ideachat:MySecurePass123@cluster0.ab1cd.mongodb.net/ideachat?retryWrites=true&w=majority
```

## Step 7: Install Dependencies & Restart Server

1. Stop your server (Ctrl+C)
2. Install the MongoDB dependency:
   ```bash
   cd server
   npm install
   ```
3. Start the server again:
   ```bash
   npm run dev
   ```

You should see:
```
Server running on port 3001
Connected to MongoDB
```

## Verify It's Working

Test the health endpoint:
```
http://localhost:3001/api/health
```

## New API Endpoints Available

With MongoDB integrated, you now have:

- **POST /api/conversations** - Save a conversation
- **GET /api/conversations** - Get all saved conversations
- **GET /api/conversations/:id** - Load a specific conversation
- **PUT /api/conversations/:id** - Update a conversation
- **DELETE /api/conversations/:id** - Delete a conversation

## Troubleshooting

**"MongoNetworkError: failed to connect"**
- Check your connection string is correct
- Verify your IP is whitelisted in Network Access
- Make sure your password doesn't contain special characters that need encoding

**"Authentication failed"**
- Double-check username and password in connection string
- Make sure you created the database user correctly

**"Connection string is invalid"**
- Ensure you replaced `<username>` and `<password>`
- Make sure there are no spaces in the connection string

## View Your Data

1. In MongoDB Atlas, go to **"Database"**
2. Click **"Browse Collections"**
3. You'll see your conversations stored here!
