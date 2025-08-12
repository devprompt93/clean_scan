# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/461cd8ce-3de9-4359-958d-985697197343

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/461cd8ce-3de9-4359-958d-985697197343) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/461cd8ce-3de9-4359-958d-985697197343) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Environment Setup

Create a `.env` file in the project root (same folder as `vite.config.ts`) and add your Google Maps API key:

```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

If not provided, the Admin map will display an input to paste a key at runtime.

## Offline submissions

Cleaning submissions are attempted against `http://localhost:4000/cleanings`. If the request fails or times out, the payload is stored in `localStorage` under `pending_cleanings` and a success message indicates it will sync later.

## Provider assignments

Admins can manage assignments at `/admin/providers`. Changes are saved to `localStorage` (`providerAssignments`) and override mock defaults during the session.

## Registration and Admin Approval

- Providers can register at `/register` with First name, Last name, Email, Password, and City.
- Registrations are stored locally in `pending_registrations` until an admin approves them in `/admin/data`.
- Admin Data Management shows a Pending section to Approve or Reject. Approving creates a provider with a city-based Provider ID and carries over email/password for login.
- Login accepts email+password (preferred) or existing mock usernames.
