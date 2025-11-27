import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { IssueHistoryService } from './issue-history.service';

@Controller('issue-history')
export class IssueHistoryController {
  constructor(private historyService: IssueHistoryService) {}

  @Get(':issueId')
  async getHistory(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.historyService.getByIssue(issueId);
  }
}
