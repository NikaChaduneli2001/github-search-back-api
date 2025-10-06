import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GithubService } from './github.service';
import { SearchRepositoriesDto, SortOrder } from '@src/models/dtos/github/search-repositories.dto';
import { ExceptionMessageCodesEnum } from '@src/core/common/exception-message-code.enum';

// Mock global fetch
global.fetch = jest.fn();

describe('GithubService', () => {
  let service: GithubService;
  let mockFetch: jest.Mock;

  beforeEach(async () => {
    mockFetch = global.fetch as jest.Mock;
    mockFetch.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [GithubService],
    }).compile();

    // Suppress logger output during tests for cleaner console
    module.useLogger(false);

    service = module.get<GithubService>(GithubService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchRepositories', () => {
    const mockGithubResponse = {
      total_count: 3,
      incomplete_results: false,
      items: [
        {
          id: 1,
          name: 'nestjs',
          full_name: 'nestjs/nest',
          owner: { login: 'nestjs', id: 1 },
          html_url: 'https://github.com/nestjs/nest',
          description: 'A progressive Node.js framework',
          stargazers_count: 50000,
          forks_count: 5000,
          open_issues_count: 100,
          language: 'TypeScript',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-10-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'awesome-nestjs',
          full_name: 'nestjs/awesome-nestjs',
          owner: { login: 'nestjs', id: 1 },
          html_url: 'https://github.com/nestjs/awesome-nestjs',
          description: 'Awesome NestJS resources',
          stargazers_count: 10000,
          forks_count: 1000,
          open_issues_count: 50,
          language: 'TypeScript',
          created_at: '2023-02-01T00:00:00Z',
          updated_at: '2023-09-01T00:00:00Z',
        },
        {
          id: 3,
          name: 'nestjs-test',
          full_name: 'test/nestjs-test',
          owner: { login: 'test', id: 2 },
          html_url: 'https://github.com/test/nestjs-test',
          description: 'Test repository',
          stargazers_count: 100,
          forks_count: 10,
          open_issues_count: 5,
          language: 'JavaScript',
          created_at: '2023-03-01T00:00:00Z',
          updated_at: '2023-08-01T00:00:00Z',
        },
      ],
    };

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should successfully search repositories without filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGithubResponse,
      });

      const searchDto: SearchRepositoriesDto = { query: 'nestjs' };
      const result = await service.searchRepositories(searchDto);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.github.com/search/repositories?q=nestjs'),
        expect.objectContaining({
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Search-API',
          },
        }),
      );
      expect(result.items).toHaveLength(3);
      expect(result.total_count).toBe(3);
      expect(result.incomplete_results).toBe(false);
    });

    it('should filter repositories by ignore parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGithubResponse,
      });

      const searchDto: SearchRepositoriesDto = {
        query: 'nestjs',
        ignore: 'test',
      };
      const result = await service.searchRepositories(searchDto);

      expect(result.items).toHaveLength(2);
      expect(result.items.every((repo) => !repo.name.toLowerCase().includes('test'))).toBe(true);
      expect(result.total_count).toBe(2);
    });

    it('should sort repositories in ascending order', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGithubResponse,
      });

      const searchDto: SearchRepositoriesDto = {
        query: 'nestjs',
        sort: SortOrder.ASC,
      };
      const result = await service.searchRepositories(searchDto);

      expect(result.items[0].name).toBe('awesome-nestjs');
      expect(result.items[1].name).toBe('nestjs');
      expect(result.items[2].name).toBe('nestjs-test');
    });

    it('should sort repositories in descending order', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGithubResponse,
      });

      const searchDto: SearchRepositoriesDto = {
        query: 'nestjs',
        sort: SortOrder.DESC,
      };
      const result = await service.searchRepositories(searchDto);

      expect(result.items[0].name).toBe('nestjs-test');
      expect(result.items[1].name).toBe('nestjs');
      expect(result.items[2].name).toBe('awesome-nestjs');
    });

    it('should filter and sort repositories together', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGithubResponse,
      });

      const searchDto: SearchRepositoriesDto = {
        query: 'nestjs',
        sort: SortOrder.ASC,
        ignore: 'test',
      };
      const result = await service.searchRepositories(searchDto);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('awesome-nestjs');
      expect(result.items[1].name).toBe('nestjs');
    });

    it('should throw rate limit exception when GitHub returns 403', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const searchDto: SearchRepositoriesDto = { query: 'nestjs' };

      await expect(service.searchRepositories(searchDto)).rejects.toThrow(
        new HttpException(
          ExceptionMessageCodesEnum.GITHUB_API_RATE_LIMIT_EXCEEDED,
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });

    it('should throw unavailable exception when GitHub returns non-403 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const searchDto: SearchRepositoriesDto = { query: 'nestjs' };

      await expect(service.searchRepositories(searchDto)).rejects.toThrow(
        new HttpException(
          ExceptionMessageCodesEnum.GITHUB_API_UNAVAILABLE,
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );
    });

    it('should throw search failed exception when fetch throws error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const searchDto: SearchRepositoriesDto = { query: 'nestjs' };

      await expect(service.searchRepositories(searchDto)).rejects.toThrow(
        new HttpException(
          ExceptionMessageCodesEnum.GITHUB_SEARCH_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should handle empty results from GitHub API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total_count: 0,
          incomplete_results: false,
          items: [],
        }),
      });

      const searchDto: SearchRepositoriesDto = { query: 'nonexistent' };
      const result = await service.searchRepositories(searchDto);

      expect(result.items).toHaveLength(0);
      expect(result.total_count).toBe(0);
    });

    it('should handle case-insensitive ignore filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGithubResponse,
      });

      const searchDto: SearchRepositoriesDto = {
        query: 'nestjs',
        ignore: 'TEST',
      };
      const result = await service.searchRepositories(searchDto);

      expect(result.items).toHaveLength(2);
      expect(result.items.every((repo) => !repo.name.toLowerCase().includes('test'))).toBe(true);
    });

    it('should handle case-insensitive sorting', async () => {
      const mixedCaseResponse = {
        ...mockGithubResponse,
        items: [
          { ...mockGithubResponse.items[0], name: 'Zebra' },
          { ...mockGithubResponse.items[1], name: 'apple' },
          { ...mockGithubResponse.items[2], name: 'Banana' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mixedCaseResponse,
      });

      const searchDto: SearchRepositoriesDto = {
        query: 'test',
        sort: SortOrder.ASC,
      };
      const result = await service.searchRepositories(searchDto);

      expect(result.items[0].name).toBe('apple');
      expect(result.items[1].name).toBe('Banana');
      expect(result.items[2].name).toBe('Zebra');
    });

    it('should encode special characters in query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockGithubResponse, items: [] }),
      });

      const searchDto: SearchRepositoriesDto = { query: 'nest+js&test' };
      await service.searchRepositories(searchDto);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('nest%2Bjs%26test'),
        expect.any(Object),
      );
    });
  });
});
