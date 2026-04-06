import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { GoalViewComponent } from './components/goal-view/goal-view.component';
import { GoalFormComponent } from './components/goal-form/goal-form.component';
import { Goal } from './services/storage.service';
import { ApiService } from './services/api.service';
import { themeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, GoalViewComponent, GoalFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private api = inject(ApiService);

  goals = signal<Goal[]>([]);
  selectedGoalId = signal<string | null>(null);
  showGoalForm = signal(false);
  editingGoal = signal<Goal | null>(null);
  isDarkMode = signal(false);

  selectedGoal = computed(() => {
    const id = this.selectedGoalId();
    return this.goals().find(g => g.id === id) || null;
  });

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  constructor() {
    this.loadGoals();
    this.initTheme();
  }

  private initTheme() {
    // Set initial dark mode state
    this.isDarkMode.set(themeService.isDarkMode());

    // Listen for changes
    themeService.onChange((isDark) => {
      this.isDarkMode.set(isDark);
    });
  }

  async toggleTheme() {
    await themeService.toggleTheme();
    this.isDarkMode.set(themeService.isDarkMode());
  }

  async loadGoals() {
    const goals = await this.api.getGoals();

    // Apply local display order preference
    const orderJson = localStorage.getItem('focus_guardian_goal_order');
    if (orderJson) {
      try {
        const order: string[] = JSON.parse(orderJson);
        const orderMap = new Map(order.map((id, idx) => [id, idx]));
        goals.sort((a, b) => {
          const ai = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
          const bi = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
          return ai - bi;
        });
      } catch {
        // ignore corrupt local order
      }
    }

    this.goals.set(goals);
    if (goals.length > 0 && !this.selectedGoalId()) {
      this.selectedGoalId.set(goals[0].id);
    }
  }

  selectGoal(goalId: string) {
    this.selectedGoalId.set(goalId);
  }

  openAddGoal() {
    this.editingGoal.set(null);
    this.showGoalForm.set(true);
  }

  openEditGoal(goal: Goal) {
    this.editingGoal.set(goal);
    this.showGoalForm.set(true);
  }

  closeGoalForm() {
    this.showGoalForm.set(false);
    this.editingGoal.set(null);
  }

  async saveGoal(goalData: Omit<Goal, 'id'>) {
    const editing = this.editingGoal();
    if (editing) {
      await this.api.updateGoal(editing.id, goalData);
    } else {
      const newGoal = await this.api.createGoal(goalData);
      this.selectedGoalId.set(newGoal.id);
    }
    await this.loadGoals();
    this.closeGoalForm();
  }

  async deleteGoal(goalId: string) {
    await this.api.deleteGoal(goalId);
    await this.loadGoals();
    if (this.selectedGoalId() === goalId) {
      this.selectedGoalId.set(this.goals()[0]?.id || null);
    }
  }

  async reorderGoals(reorderedGoals: Goal[]) {
    this.goals.set(reorderedGoals);
    localStorage.setItem('focus_guardian_goal_order', JSON.stringify(reorderedGoals.map(g => g.id)));
  }
}
