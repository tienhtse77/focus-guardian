import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { GoalViewComponent } from './components/goal-view/goal-view.component';
import { GoalFormComponent } from './components/goal-form/goal-form.component';
import { StorageService, Goal } from './services/storage.service';
import { themeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, GoalViewComponent, GoalFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private storageService = new StorageService();

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
    const goals = await this.storageService.getGoals();
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
      await this.storageService.updateGoal(editing.id, goalData);
    } else {
      const newGoal = await this.storageService.addGoal(goalData);
      this.selectedGoalId.set(newGoal.id);
    }
    await this.loadGoals();
    this.closeGoalForm();
  }

  async deleteGoal(goalId: string) {
    await this.storageService.deleteGoal(goalId);
    await this.loadGoals();
    if (this.selectedGoalId() === goalId) {
      this.selectedGoalId.set(this.goals()[0]?.id || null);
    }
  }

  async reorderGoals(reorderedGoals: Goal[]) {
    this.goals.set(reorderedGoals);
    await this.storageService.setGoals(reorderedGoals);
  }
}
