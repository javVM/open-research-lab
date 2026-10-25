import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Location } from '../../../core/models';
import { CollectionService } from '../../collection.service';
import { StorageConditionService } from '../../shared/storage-condition.service';
import { registerAppIcons } from '../../shared/icons';

@Component({
  standalone: true,
  selector: 'app-drawer-details',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './drawer-details.component.html',
  styleUrl: './drawer-details.component.scss',
})
export class DrawerDetailsComponent {
  readonly location = input.required<Location>();
  private readonly collection = inject(CollectionService);
  protected readonly sc = inject(StorageConditionService);
  constructor(){ registerAppIcons(); }
  readonly effective = computed(()=> this.sc.effective(this.collection.dataset().locations, this.location().id));
  readonly inherited = computed(()=> !this.location().storageConditions?.length);
  readonly primaryCondition = computed(()=> this.effective()[0]);
  readonly tooltip = computed(()=> {
    const eff = this.effective().map(c=> this.sc.label(c)).join(', ');
    return this.inherited()? `${eff} · heredado` : eff;
  });
}
