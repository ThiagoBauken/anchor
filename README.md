# AnchorView - Local Development Setup with Docker

This is a Next.js application for managing anchor points, powered by Prisma and PostgreSQL, and containerized with Docker for easy local development.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [VS Code](https://code.visualstudio.com/) with the [Docker Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) (recommended).
- A Google AI API key for Genkit features. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

## 1. Environment Variables

The application requires environment variables for the database connection and Google AI services.

1.  Make a copy of the `.env.local.example` file and rename it to `.env.local`.
2.  Open the newly created `.env.local` file. The default database values are already configured to work with the Docker setup.
3.  Add your Google AI API key:

    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

    **Note:** The `.env.local` file is listed in `.gitignore` and will not be committed to your repository.

## 2. Running the Application with Docker

With Docker, you can start the entire application (Next.js app + PostgreSQL database) with a single command.

1.  **Open a terminal in VS Code.**
2.  **Run the following command:**

    ```bash
    docker-compose up --build
    ```

    - `--build`: This flag tells Docker to rebuild the application image if there have been any changes to the `Dockerfile` or source code. It's good practice to include this the first time you run it.
    - This command will download the PostgreSQL image, build your application's image, and start both containers.

3.  **Wait for the build and startup process to complete.** You will see logs from both the database and the application in your terminal.

## 3. Accessing the Application

-   **Web Application:** Once the containers are running, you can access the main interface at `http://localhost:9002`.
-   **Genkit AI Backend (Optional):** To inspect your AI flows, open a *second terminal* and run:
    ```bash
    npm run genkit:watch
    ```
    This will start the Genkit development UI, usually on `http://localhost:4000`.

Your application is now fully running inside Docker containers! Any changes you make to the source code will trigger an automatic reload of the application.

## 4. Stopping the Application

To stop the containers, press `Ctrl + C` in the terminal where `docker-compose` is running. To remove the containers and the database volume (deleting all data), you can run:

```bash
docker-compose down -v
```
