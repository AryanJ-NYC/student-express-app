const { createClerkClient } = require('@clerk/backend');

module.exports = {
  clerkClient: createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }),
};
