import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environment';
import { Goal, Content, SavedPage, ContentSource, PageStatus } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  // --- Goals ---

  async getGoals(): Promise<Goal[]> {
    try {
      const dtos = await firstValueFrom(this.http.get<any[]>(`${this.baseUrl}/goals`));
      return (dtos ?? []).map(dto => this.mapGoalFromApi(dto));
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      return [];
    }
  }

  async createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    const body = this.mapGoalToApi(goal);
    const dto = await firstValueFrom(this.http.post<any>(`${this.baseUrl}/goals`, body));
    return this.mapGoalFromApi(dto);
  }

  async updateGoal(id: string, goal: Omit<Goal, 'id'>): Promise<Goal> {
    const body = this.mapGoalToApi(goal);
    const dto = await firstValueFrom(this.http.put<any>(`${this.baseUrl}/goals/${id}`, body));
    return this.mapGoalFromApi(dto);
  }

  async deleteGoal(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/goals/${id}`));
  }

  async bulkAddSources(goalId: string, sources: ContentSource[]): Promise<{ added: number; skipped: number }> {
    const body = sources.map(s => ({
      type: this.mapSourceTypeToApi(s.type),
      url: s.url,
    }));
    const result = await firstValueFrom(
      this.http.post<{ added: number; skipped: number }>(`${this.baseUrl}/goals/${goalId}/sources/bulk`, body)
    );
    return result;
  }

  // --- Content ---

  async getContent(goalId: string): Promise<Content[]> {
    try {
      const dtos = await firstValueFrom(this.http.get<any[]>(`${this.baseUrl}/goals/${goalId}/content`));
      return (dtos ?? []).map(dto => this.mapContentFromApi(dto));
    } catch (error) {
      console.error('Failed to fetch content:', error);
      return [];
    }
  }

  async createContent(goalId: string, content: { title: string; url: string; thumbnail?: string; estimatedMin: number; source: string }): Promise<Content> {
    const body = {
      title: content.title,
      url: content.url,
      thumbnail: content.thumbnail,
      estimatedMinutes: content.estimatedMin,
      source: content.source,
    };
    const dto = await firstValueFrom(this.http.post<any>(`${this.baseUrl}/goals/${goalId}/content`, body));
    return this.mapContentFromApi(dto);
  }

  async markConsumed(contentId: string): Promise<void> {
    await firstValueFrom(this.http.patch<void>(`${this.baseUrl}/content/${contentId}/consumed`, {}));
  }

  // --- Saved Pages ---

  async getSavedPages(goalId: string): Promise<SavedPage[]> {
    try {
      const dtos = await firstValueFrom(this.http.get<any[]>(`${this.baseUrl}/goals/${goalId}/saved-pages`));
      return (dtos ?? []).map(dto => this.mapSavedPageFromApi(dto));
    } catch (error) {
      console.error('Failed to fetch saved pages:', error);
      return [];
    }
  }

  async savePage(goalId: string, page: { title: string; url: string; favicon?: string }): Promise<SavedPage> {
    const body = {
      title: page.title,
      url: page.url,
      favicon: page.favicon,
    };
    const dto = await firstValueFrom(this.http.post<any>(`${this.baseUrl}/goals/${goalId}/saved-pages`, body));
    return this.mapSavedPageFromApi(dto);
  }

  async updatePageStatus(pageId: string, status: PageStatus): Promise<SavedPage> {
    const body = { status: this.mapStatusToApi(status) };
    const dto = await firstValueFrom(
      this.http.patch<any>(`${this.baseUrl}/saved-pages/${pageId}/status`, body)
    );
    return this.mapSavedPageFromApi(dto);
  }

  async deleteSavedPage(pageId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/saved-pages/${pageId}`));
  }

  // --- Private mapping helpers ---

  private mapGoalFromApi(dto: any): Goal {
    return {
      id: dto.id,
      title: dto.title,
      icon: dto.icon,
      color: dto.color,
      sources: (dto.contentSources ?? dto.sources ?? []).map((s: any) => ({
        type: this.mapSourceTypeFromApi(s.type),
        url: s.url,
      })),
    };
  }

  private mapGoalToApi(goal: Omit<Goal, 'id'>): any {
    return {
      title: goal.title,
      icon: goal.icon,
      color: goal.color,
      sources: (goal.sources ?? []).map(s => ({
        type: this.mapSourceTypeToApi(s.type),
        url: s.url,
      })),
    };
  }

  private mapContentFromApi(dto: any): Content {
    return {
      id: dto.id,
      goalId: dto.goalId,
      title: dto.title,
      url: dto.url,
      thumbnail: dto.thumbnail,
      estimatedMin: dto.estimatedMinutes ?? dto.estimatedMin,
      source: dto.source,
      consumed: dto.consumed ?? false,
      fetchedAt: dto.fetchedAt ? new Date(dto.fetchedAt).getTime() : Date.now(),
    };
  }

  private mapSavedPageFromApi(dto: any): SavedPage {
    return {
      id: dto.id,
      goalId: dto.goalId,
      title: dto.title,
      url: dto.url,
      favicon: dto.favicon,
      savedAt: dto.savedAt ? new Date(dto.savedAt).getTime() : Date.now(),
      status: this.mapStatusFromApi(dto.status),
    };
  }

  private mapSourceTypeToApi(type: string): string {
    const map: Record<string, string> = {
      'rss': 'Rss',
      'youtube': 'YouTube',
      'reddit': 'Reddit',
    };
    return map[type] ?? type;
  }

  private mapSourceTypeFromApi(type: string): string {
    const map: Record<string, string> = {
      'Rss': 'rss',
      'YouTube': 'youtube',
      'Reddit': 'reddit',
    };
    return map[type] ?? type.toLowerCase();
  }

  private mapStatusToApi(status: PageStatus): string {
    const map: Record<string, string> = {
      'unread': 'Unread',
      'viewed': 'Viewed',
      'favorite': 'Favorite',
      'watch-later': 'WatchLater',
    };
    return map[status] ?? status;
  }

  private mapStatusFromApi(status: string): PageStatus {
    const map: Record<string, PageStatus> = {
      'Unread': 'unread',
      'Viewed': 'viewed',
      'Favorite': 'favorite',
      'WatchLater': 'watch-later',
    };
    return map[status] ?? (status.toLowerCase() as PageStatus);
  }
}
