// Mock AWS Amplify API
const mockGraphQL = jest.fn();

module.exports = {
  API: {
    graphql: mockGraphQL,
  },
  graphqlOperation: jest.fn((query, variables) => ({ query, variables })),
  __mockGraphQL: mockGraphQL,
  __resetMocks: () => {
    mockGraphQL.mockReset();
  },
  __setMockResponse: (response) => {
    mockGraphQL.mockResolvedValueOnce(response);
  },
  __setMockResponses: (responses) => {
    responses.forEach(response => {
      mockGraphQL.mockResolvedValueOnce(response);
    });
  },
};
