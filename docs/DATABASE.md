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
