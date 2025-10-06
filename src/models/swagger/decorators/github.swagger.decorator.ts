import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { SearchRepositoriesResponseDto } from '@src/models/dtos/github/repository-response.dto';
import { SortOrder } from '@src/models/dtos/github/search-repositories.dto';

export function ApiSearchRepositories() {
  return applyDecorators(
    ApiOperation({
      summary: 'Search GitHub repositories',
      description: 'Search for repositories on GitHub with optional sorting and filtering',
    }),
    ApiQuery({
      name: 'query',
      required: true,
      description: 'Search query string for repositories',
      example: 'nestjs',
    }),
    ApiQuery({
      name: 'sort',
      required: false,
      enum: SortOrder,
      description: 'Sort repositories by name (ascending or descending)',
      example: SortOrder.ASC,
    }),
    ApiQuery({
      name: 'ignore',
      required: false,
      description: 'Ignore repositories where the name includes this string',
      example: 'test',
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved repositories',
      type: SearchRepositoriesResponseDto,
      schema: {
        example: {
          total_count: 150,
          incomplete_results: false,
          items: [
            {
              id: 123456789,
              name: 'nest',
              full_name: 'nestjs/nest',
              owner: {
                login: 'nestjs',
                id: 1234567,
                avatar_url: 'https://avatars.githubusercontent.com/u/1234567?v=4',
                html_url: 'https://github.com/nestjs',
              },
              html_url: 'https://github.com/nestjs/nest',
              description: 'A progressive Node.js framework',
              stargazers_count: 50000,
              forks_count: 5000,
              open_issues_count: 100,
              language: 'TypeScript',
              created_at: '2023-01-15T10:30:00Z',
              updated_at: '2023-10-05T14:20:00Z',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid query parameters',
      schema: {
        example: {
          statusCode: 400,
          message: 'Validation failed',
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests - GitHub API rate limit exceeded',
      schema: {
        example: {
          statusCode: 429,
          message: 'GITHUB_API_RATE_LIMIT_EXCEEDED',
          error: 'Too Many Requests',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: {
        example: {
          statusCode: 500,
          message: 'GITHUB_SEARCH_FAILED',
          error: 'Internal Server Error',
        },
      },
    }),
    ApiResponse({
      status: 503,
      description: 'Service Unavailable - GitHub API is not available',
      schema: {
        example: {
          statusCode: 503,
          message: 'GITHUB_API_UNAVAILABLE',
          error: 'Service Unavailable',
        },
      },
    }),
  );
}

export function ApiGithubController() {
  return applyDecorators(
    ApiTags('GitHub'),
  );
}
