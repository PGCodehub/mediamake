import { Octokit } from '@octokit/rest';

interface CommentOptions {
  owner?: string;
  repo?: string;
  body: string;
  commentId?: number;
}

interface GitHubComment {
  id: number;
  body?: string;
}

export class PRCommentor {
  private octokit: Octokit;
  private DEFAULT_OWNER = 'microfox-ai';
  private DEFAULT_REPO = 'microfox';
  private issueNumber: number | undefined;

  constructor(octokit: Octokit, issueNumber?: number) {
    this.octokit = octokit;
    this.issueNumber = issueNumber;
  }

  /**
   * Creates a new comment on a PR
   */
  async createComment({
    owner,
    repo,
    body,
  }: CommentOptions): Promise<number | null> {
    if (!this.issueNumber) {
      return null;
    }

    const response = await this.octokit.issues.createComment({
      owner: owner || this.DEFAULT_OWNER,
      repo: repo || this.DEFAULT_REPO,
      issue_number: this.issueNumber,
      body,
    });

    return response.data.id;
  }

  /**
   * Updates an existing comment on a PR
   */
  async updateComment({
    owner,
    repo,
    body,
    commentId,
  }: CommentOptions): Promise<void> {
    if (!commentId) {
      throw new Error('commentId is required for updating a comment');
    }

    if (!this.issueNumber) {
      return;
    }

    await this.octokit.issues.updateComment({
      owner: owner || this.DEFAULT_OWNER,
      repo: repo || this.DEFAULT_REPO,
      comment_id: commentId,
      issue_number: this.issueNumber,
      body,
    });
  }

  /**
   * Finds a comment by a specific identifier in its body
   * Useful for finding and updating a specific comment later
   */
  async findCommentByMarker(
    { owner, repo }: Omit<CommentOptions, 'body' | 'commentId'>,
    marker: string,
  ): Promise<number | null> {
    if (!this.issueNumber) {
      return null;
    }

    const comments = await this.octokit.issues.listComments({
      owner: owner || this.DEFAULT_OWNER,
      repo: repo || this.DEFAULT_REPO,
      issue_number: this.issueNumber,
    });

    const comment = comments.data.find((comment: GitHubComment) =>
      comment.body?.includes(marker),
    );
    return comment?.id || null;
  }

  /**
   * Creates or updates a comment based on a marker
   * If a comment with the marker exists, it updates it
   * Otherwise, creates a new comment
   */
  async createOrUpdateComment(
    { owner, repo, body }: CommentOptions,
    marker: string,
  ): Promise<number | null> {
    if (!this.issueNumber) {
      return null;
    }

    const existingCommentId = await this.findCommentByMarker(
      {
        owner: owner || this.DEFAULT_OWNER,
        repo: repo || this.DEFAULT_REPO,
      },
      marker,
    );

    if (existingCommentId) {
      await this.updateComment({
        owner,
        repo,
        body,
        commentId: existingCommentId,
      });
      return existingCommentId;
    } else {
      return await this.createComment({
        owner,
        repo,
        body,
      });
    }
  }
}
