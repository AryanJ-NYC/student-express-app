const { createClerkClient } = require('@clerk/express');

module.exports = {
  clerkClient: createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }),
};
