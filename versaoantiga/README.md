# AnchorView - Local Development Setup

This is a Next.js application for managing anchor points, powered by Firebase and Genkit. Follow the steps below to run the project locally for development.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A Google AI API key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

## 1. Installation

First, install the project dependencies using npm:

```bash
npm install
```

## 2. Environment Variables

The application uses Genkit to connect to Google's AI services, which requires an API key.

1.  Make a copy of the `.env.local.example` file and rename it to `.env.local`.
2.  Open the newly created `.env.local` file and add your Google AI API key.

    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

    **Note:** The `.env.local` file is listed in `.gitignore` and will not be committed to your repository, keeping your API key secure.

## 3. Running the Application

To run the full application, you need to start two separate development servers: one for the Next.js frontend and one for the Genkit AI backend. The easiest way to do this is by opening two terminals in VS Code.

### Terminal 1: Start the Next.js Frontend

In your first terminal, run the following command to start the web application:

```bash
npm run dev
```

This will typically start the app on `http://localhost:9002`.

### Terminal 2: Start the Genkit AI Backend

In your second terminal, run the following command to start the Genkit development server, which handles all AI-related tasks:

```bash
npm run genkit:watch
```

This will start the Genkit development UI, usually on `http://localhost:4000`, where you can inspect your AI flows.

Your application is now running! You can access the main interface at `http://localhost:9002`. The two servers will automatically reload as you make changes to the code.
