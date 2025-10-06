import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  SearchRepositoriesDto,
  SortOrder,
} from '@src/models/dtos/github/search-repositories.dto';
import { SearchRepositoriesResponseDto } from '@src/models/dtos/github/repository-response.dto';
import { ExceptionMessageCodesEnum } from '@src/core/common/exception-message-code.enum';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly GITHUB_API_URL = 'https://api.github.com';

  async searchRepositories(
    searchDto: SearchRepositoriesDto,
  ): Promise<SearchRepositoriesResponseDto> {
    const { query, sort, ignore } = searchDto;

    try {
      const url = `${
        this.GITHUB_API_URL
      }/search/repositories?q=${encodeURIComponent(query)}&per_page=100`;

      this.logger.log(`Searching GitHub repositories with query: ${query}`);

      const response = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'GitHub-Search-API',
        },
      });

      if (!response.ok) {
        this.logger.error(
          `GitHub API error: ${response.status} ${response.statusText}`,
        );

        if (response.status === 403) {
          throw new HttpException(
            ExceptionMessageCodesEnum.GITHUB_API_RATE_LIMIT_EXCEEDED,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        throw new HttpException(
          ExceptionMessageCodesEnum.GITHUB_API_UNAVAILABLE,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const data: SearchRepositoriesResponseDto = await response.json();
      let filteredItems = data.items;
      if (ignore) {
        filteredItems = filteredItems.filter(
          (repo) => !repo.name.toLowerCase().includes(ignore.toLowerCase()),
        );
        this.logger.log(
          `Filtered ${
            data.items.length - filteredItems.length
          } repositories containing "${ignore}"`,
        );
      }

      if (sort) {
        filteredItems.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();

          if (sort === SortOrder.ASC) {
            return nameA.localeCompare(nameB);
          } else {
            return nameB.localeCompare(nameA);
          }
        });
        this.logger.log(`Sorted repositories in ${sort} order`);
      }

      return {
        total_count: filteredItems.length,
        incomplete_results: data.incomplete_results,
        items: filteredItems,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error searching repositories: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        ExceptionMessageCodesEnum.GITHUB_SEARCH_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
