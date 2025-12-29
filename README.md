
# PayMind: Your Private, Offline-First Payment Reminder

PayMind is a simple yet powerful progressive web app (PWA) designed to help you keep track of upcoming bills and payments. Built with a focus on privacy and simplicity, it works completely offline and stores all your data securely on your own device. There are no ads, no subscriptions, and no cloud accounts required.

![PayMind App Screenshot Placeholder](https://placehold.co/600x400/222639/7984D7?text=PayMind+App)

## Core Philosophy

In a world where every app wants your data, PayMind is different. Its core mission is to provide a useful utility without compromising your privacy.

- **100% Private:** All data you enter is stored exclusively in your browser's local storage. It never leaves your device.
- **Offline First:** Designed to work without an internet connection. Whether you're on a plane or just want to disconnect, your financial reminders are always accessible.
- **No Costs, No Ads:** PayMind is free and contains no advertisements, in-app purchases, or distracting clutter.

## Key Features

- **Log Expenses:** Quickly add new bills with details like title, amount, due date, and category.
- **Track Due Dates:** See a clear, sorted list of your upcoming and paid expenses. The app highlights overdue payments and payments due today.
- **Recurring Payments:** Set expenses to "Monthly" recurrence. Once you mark a bill as paid, the app automatically schedules the next one for the following month.
- **Smart Reminders with AI:** Use the built-in AI assistant to get intelligent suggestions for the best reminder time based on the payment type and due date.
- **Categorize and Organize:** Assign categories (e.g., Housing, Utilities, Subscriptions) with clear icons to easily identify your expenses at a glance.
- **Client-Side Notifications:** Receive browser-based notifications on your device when a payment is due, ensuring you never miss a deadline.
- **Modern, Clean Interface:** A beautiful and intuitive user interface built with the latest web technologies, including a dark mode theme.

## Value Proposition

PayMind offers peace of mind through simplicity and privacy. It is the ideal solution for anyone who wants:
- A straightforward tool to manage bills without the complexity of a full-fledged budgeting app.
- To keep their financial information completely private and off the cloud.
- A reliable reminder system that works offline and doesn't require an account or internet access.

## Tech Stack

PayMind is built with a modern, production-ready tech stack:

- **Framework:** [Next.js](https://nextjs.org/) (with static export for PWA)
- **UI Library:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **AI/Generative UI:** [Google's Genkit](https://firebase.google.com/docs/genkit)
- **Native App Wrapper:** [Capacitor](https://capacitorjs.com/) (for converting the PWA to native iOS and Android)
- **PWA Functionality:** [next-pwa](https://www.npmjs.com/package/next-pwa)

## From PWA to App Store

This project is structured to be seamlessly converted into a native mobile app for both the Apple App Store and Google Play Store using Capacitor. By building as a static PWA, all necessary assets are bundled for a true offline-native experience. The project includes the necessary configurations to begin the Capacitor build process.
