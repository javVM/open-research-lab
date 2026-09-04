import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../../navigation.service';
import { SettingsService } from '../../settings.service';

@Component({
  standalone: true,
  selector: 'app-profile-menu',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss',
})
export class ProfileMenuComponent {
  private readonly settings = inject(SettingsService);
  private readonly navigation = inject(NavigationService);

  protected readonly open = signal(false);
  protected readonly initials = computed(() => this.settings.operatorInitials());
  protected readonly displayName = computed(() => this.settings.settings().operatorName || '—');
  protected readonly email = computed(() => this.settings.settings().institutionalEmail);

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected goToProfile(): void {
    this.close();
    this.navigation.setUiMode('settings');
  }

  protected logout(): void {
    this.close();
    this.settings.clearProfile();
  }
}
