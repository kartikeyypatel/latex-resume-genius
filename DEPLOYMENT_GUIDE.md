# 🚀 How to Deploy to GitHub Pages

This guide will walk you through setting up your Resume Tailor Pro application to be automatically deployed and hosted on GitHub Pages.

## 📋 What's Been Done

I have already:
1.  **Created a GitHub Actions Workflow**: Added `.github/workflows/deploy.yml` to your repository.
2.  **Configured the Build Process**: The workflow will automatically install dependencies and build your application.
3.  **Set Up Deployment**: The built application will be deployed to GitHub Pages.
4.  **Updated Vite Configuration**: Set the correct base path in `vite.config.ts` for GitHub Pages compatibility.

## ⚙️ Your Next Steps (3 Simple Steps)

You just need to configure your repository to enable GitHub Pages and provide the necessary API key.

### Step 1: Add Your Gemini API Key as a Repository Secret

To build the project, the workflow needs your Gemini API key. It's crucial to store this securely.

1.  In your GitHub repository, go to **Settings** > **Secrets and variables** > **Actions**.
2.  Click the **New repository secret** button.
3.  For the **Name**, enter `VITE_GEMINI_API_KEY`.
4.  For the **Secret**, paste your actual Gemini API key.
5.  Click **Add secret**.

![Add Secret](https://i.imgur.com/7g3Y4s9.png)

This ensures your API key is encrypted and safely accessed by the workflow without being exposed.

### Step 2: Configure GitHub Pages Settings

Next, tell GitHub where to find your built website files.

1.  In your GitHub repository, go to **Settings** > **Pages**.
2.  Under **Build and deployment**, for the **Source**, select **GitHub Actions**.
3.  Click **Save**.

![Configure Pages](https://i.imgur.com/k2yV9lZ.png)

This configures GitHub Pages to expect the deployment to come from the workflow we just created.

### Step 3: Trigger the Deployment

The deployment will automatically trigger every time you push a new commit to the `main` branch.

To trigger the first deployment manually:

1.  Go to the **Actions** tab in your GitHub repository.
2.  In the left sidebar, click on the **Deploy to GitHub Pages** workflow.
3.  Click the **Run workflow** dropdown on the right, and then click the green **Run workflow** button.

![Run Workflow](https://i.imgur.com/3h8f1Xg.png)

## 🎉 That's It!

Once the workflow completes, your Resume Tailor Pro application will be live!

You can find the URL for your live site in the **Settings** > **Pages** section of your repository, or on the summary page of the deploy action.

Now, every time you push changes to your `main` branch, your site will be automatically updated. 