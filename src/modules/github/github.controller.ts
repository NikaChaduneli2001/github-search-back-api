import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { GithubService } from './github.service';
import { SearchRepositoriesDto } from '@src/models/dtos/github/search-repositories.dto';
import { SearchRepositoriesResponseDto } from '@src/models/dtos/github/repository-response.dto';
import {
  ApiGithubController,
  ApiSearchRepositories,
} from '@src/models/swagger/decorators/github.swagger.decorator';
import { Auth } from '@src/core/decorators/http.decorator';

@ApiGithubController()
@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('search')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiSearchRepositories()
  async searchRepositories(
    @Query() searchDto: SearchRepositoriesDto,
  ): Promise<SearchRepositoriesResponseDto> {
    return await this.githubService.searchRepositories(searchDto);
  }
}
