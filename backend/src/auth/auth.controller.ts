import { BadGatewayException, Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { signGithubToken } from './github-token.util';

@Controller('auth/github')
export class AuthController {
  @Get('login')
  login(@Res() res: Response) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL ?? 'http://localhost:3001'}/auth/github/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user`;
    res.redirect(url);
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';

    if (!code) {
      return res.redirect(`${frontendUrl}?gh_error=missing_code`);
    }

    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const tokenData = (await tokenRes.json()) as { access_token?: string };
      if (!tokenData.access_token) {
        return res.redirect(`${frontendUrl}?gh_error=token_exchange_failed`);
      }

      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = (await userRes.json()) as { login?: string };
      if (!userData.login) {
        return res.redirect(`${frontendUrl}?gh_error=user_fetch_failed`);
      }

      const signedToken = signGithubToken(userData.login);
      res.redirect(
        `${frontendUrl}?gh_token=${encodeURIComponent(signedToken)}&gh_username=${encodeURIComponent(userData.login)}`,
      );
    } catch {
      res.redirect(`${frontendUrl}?gh_error=unexpected`);
    }
  }

  @Get('repos')
  async getUserRepos(@Query('username') username: string) {
    if (!username) {
      throw new BadGatewayException('Missing username');
    }

    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=50`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );

    if (!res.ok) {
      throw new BadGatewayException('Failed to fetch repositories from GitHub');
    }

    const data = (await res.json()) as Array<{ full_name: string; name: string; fork: boolean }>;

    return data.map((repo) => ({ fullName: repo.full_name, name: repo.name, fork: repo.fork }));
  }

  @Get('prs')
  async getUserPRs(@Query('username') username: string, @Query('repo') repo?: string) {
    if (!username) {
      throw new BadGatewayException('Missing username');
    }

    if (repo) {
      // Repo already selected — use the direct per-repo endpoint (cleaner,
      // higher rate limit than search) and filter to this user's PRs.
      const res = await fetch(
        `https://api.github.com/repos/${repo}/pulls?state=all&per_page=30&sort=created&direction=desc`,
        { headers: { Accept: 'application/vnd.github+json' } },
      );
      if (!res.ok) {
        throw new BadGatewayException('Failed to fetch pull requests from GitHub');
      }
      const data = (await res.json()) as Array<{
        title: string;
        html_url: string;
        number: number;
        state: string;
        user: { login: string };
        merged_at: string | null;
      }>;

      return data
        .filter((pr) => pr.user.login.toLowerCase() === username.toLowerCase())
        .map((pr) => ({
          title: pr.title,
          url: pr.html_url,
          number: pr.number,
          repo,
          state: pr.state,
          merged: !!pr.merged_at,
        }));
    }

    // No repo selected yet — fall back to search across all public repos.
    const res = await fetch(
      `https://api.github.com/search/issues?q=type:pr+author:${encodeURIComponent(username)}&sort=created&order=desc&per_page=25`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );

    if (!res.ok) {
      throw new BadGatewayException('Failed to fetch pull requests from GitHub');
    }

    const data = (await res.json()) as {
      items: Array<{
        title: string;
        html_url: string;
        number: number;
        repository_url: string;
        state: string;
        pull_request?: { merged_at?: string | null };
      }>;
    };

    return data.items.map((item) => ({
      title: item.title,
      url: item.html_url,
      number: item.number,
      repo: item.repository_url.replace('https://api.github.com/repos/', ''),
      state: item.state,
      merged: !!item.pull_request?.merged_at,
    }));
  }
}
