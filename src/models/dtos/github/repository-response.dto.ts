import { ApiProperty } from '@nestjs/swagger';

export class RepositoryOwnerDto {
  @ApiProperty({ example: 'nestjs' })
  login: string;

  @ApiProperty({ example: 1234567 })
  id: number;

  @ApiProperty({ example: 'https://avatars.githubusercontent.com/u/1234567?v=4' })
  avatar_url: string;

  @ApiProperty({ example: 'https://github.com/nestjs' })
  html_url: string;
}

export class RepositoryDto {
  @ApiProperty({ example: 123456789 })
  id: number;

  @ApiProperty({ example: 'nestjs' })
  name: string;

  @ApiProperty({ example: 'nestjs/nest' })
  full_name: string;

  @ApiProperty({ type: RepositoryOwnerDto })
  owner: RepositoryOwnerDto;

  @ApiProperty({ example: 'https://github.com/nestjs/nest' })
  html_url: string;

  @ApiProperty({ example: 'A progressive Node.js framework' })
  description: string | null;

  @ApiProperty({ example: 50000 })
  stargazers_count: number;

  @ApiProperty({ example: 5000 })
  forks_count: number;

  @ApiProperty({ example: 100 })
  open_issues_count: number;

  @ApiProperty({ example: 'TypeScript' })
  language: string | null;

  @ApiProperty({ example: '2023-01-15T10:30:00Z' })
  created_at: string;

  @ApiProperty({ example: '2023-10-05T14:20:00Z' })
  updated_at: string;
}

export class SearchRepositoriesResponseDto {
  @ApiProperty({
    description: 'Total count of repositories found',
    example: 1000,
  })
  total_count: number;

  @ApiProperty({
    description: 'Indicates if results are incomplete',
    example: false,
  })
  incomplete_results: boolean;

  @ApiProperty({
    description: 'Array of repository items',
    type: [RepositoryDto],
  })
  items: RepositoryDto[];
}
