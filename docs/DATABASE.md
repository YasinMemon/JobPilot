# Database Models

## User
- **Purpose:** Stores user profiles and authentication references.
- **Key Fields:** `fullName`, `authUserId`, `role`, `currentJobTitle`, `skills`

## Application
- **Purpose:** Tracks parsed job applications from emails.
- **Key Fields:** `userId`, `company`, `position`, `status`, `gmailMessageId`
- **Indexes:** Compound text index on company, position, emails for search.

## AIActivity
- **Purpose:** Logs user interactions with the AI assistant.
- **Key Fields:** `userId`, `type`, `title`, `description`, `metadata`

## AIConversation & AIMessage
- **Purpose:** Manages chat history with the AI.

## Notification
- **Purpose:** In-app notifications per user (application, interview, security, announcement, job-match events).
- **Key Fields:** `userId`, `type`, `title`, `message`, `link`, `metadata`, `isRead`, `readAt`, `dedupeKey`
- **Indexes:** `{userId,_id:-1}`, `{userId,isRead,_id:-1}`, unique partial `{userId,dedupeKey}` (duplicate prevention), TTL on `createdAt` (180 days).
- **Also:** `Application.interviewAt` (optional) drives interview notifications and reminders.
