export const testUsers = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || "admin@horde.test",
    password: process.env.TEST_ADMIN_PASSWORD || "testpassword123",
  },
  editor: {
    email: process.env.TEST_EDITOR_EMAIL || "editor@horde.test",
    password: process.env.TEST_EDITOR_PASSWORD || "testpassword123",
  },
  client: {
    email: process.env.TEST_CLIENT_EMAIL || "client@horde.test",
    password: process.env.TEST_CLIENT_PASSWORD || "testpassword123",
  },
};

export const testData = {
  clients: {
    new: {
      name: "Test Client Corp",
      email: "newclient@test.com",
      phone: "+32 471 123 456",
      projectType: "website",
      sector: "tech",
    },
  },
  projects: {
    new: {
      name: "Test Website Project",
      description: "A test project for E2E testing",
    },
  },
};
