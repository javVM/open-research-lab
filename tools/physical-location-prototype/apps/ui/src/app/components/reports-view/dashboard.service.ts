import { Injectable, computed, signal } from '@angular/core';
import {
  DASHBOARD_DEFAULT_TEMPLATES,
  DASHBOARD_DEFAULT_TEMPLATE_ID,
  DASHBOARD_STORAGE_KEY,
} from './dashboard.constants';
import type { DashboardState, DashboardTemplate, WidgetKind } from './dashboard.model';
import { ALL_WIDGET_KINDS } from './dashboard.model';

function cloneTemplate(template: DashboardTemplate): DashboardTemplate {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    widgetKinds: [...template.widgetKinds],
  };
}

function cloneTemplates(templates: readonly DashboardTemplate[]): DashboardTemplate[] {
  return templates.map(cloneTemplate);
}

function readStoredState(): DashboardState | null {
  try {
    const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as DashboardState;
    if (!parsed || typeof parsed.activeTemplateId !== 'string' || !Array.isArray(parsed.templates)) {
      return null;
    }
    const validKinds = new Set<string>(ALL_WIDGET_KINDS);
    const sanitizedTemplates: DashboardTemplate[] = parsed.templates
      .filter((template) => typeof template.id === 'string' && Array.isArray(template.widgetKinds))
      .map((template) => ({
        id: template.id,
        name: typeof template.name === 'string' ? template.name : template.id,
        description: typeof template.description === 'string' ? template.description : '',
        widgetKinds: (template.widgetKinds as string[]).filter((kind): kind is WidgetKind =>
          validKinds.has(kind),
        ),
      }));

    const activeExists = sanitizedTemplates.some((template) => template.id === parsed.activeTemplateId);
    return {
      activeTemplateId: activeExists ? parsed.activeTemplateId : sanitizedTemplates[0].id,
      templates: sanitizedTemplates,
    };
  } catch {
    return null;
  }
}

function defaultState(): DashboardState {
  return {
    activeTemplateId: DASHBOARD_DEFAULT_TEMPLATE_ID,
    templates: cloneTemplates(DASHBOARD_DEFAULT_TEMPLATES),
  };
}

/**
 * Manages dashboard templates — which widgets are visible and in which order.
 * Persisted to localStorage so choices survive demo resets. Keeps built-in
 * templates editable in place (no separate override map) for simplicity.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly state = signal<DashboardState>(readStoredState() ?? defaultState());

  readonly templates = computed(() => this.state().templates);
  readonly activeTemplateId = computed(() => this.state().activeTemplateId);
  readonly activeTemplate = computed(() => {
    const current = this.state();
    return (
      current.templates.find((template) => template.id === current.activeTemplateId) ??
      current.templates[0]
    );
  });

  setActiveTemplate(templateId: string): void {
    const exists = this.state().templates.some((template) => template.id === templateId);
    if (!exists) {
      return;
    }
    this.updateState({ ...this.state(), activeTemplateId: templateId });
  }

  toggleWidget(templateId: string, kind: WidgetKind): void {
    const current = this.state();
    const templates = current.templates.map((template) => {
      if (template.id !== templateId) {
        return template;
      }
      const hasKind = template.widgetKinds.includes(kind);
      const nextKinds = hasKind
        ? template.widgetKinds.filter((item) => item !== kind)
        : [...template.widgetKinds, kind];
      return { ...template, widgetKinds: nextKinds };
    });
    this.updateState({ ...current, templates });
  }

  setWidgetEnabled(templateId: string, kind: WidgetKind, enabled: boolean): void {
    const current = this.state();
    const templates = current.templates.map((template) => {
      if (template.id !== templateId) {
        return template;
      }
      const hasKind = template.widgetKinds.includes(kind);
      if (hasKind === enabled) {
        return template;
      }
      const nextKinds = enabled
        ? [...template.widgetKinds, kind]
        : template.widgetKinds.filter((item) => item !== kind);
      return { ...template, widgetKinds: nextKinds };
    });
    this.updateState({ ...current, templates });
  }

  moveWidget(templateId: string, kind: WidgetKind, direction: -1 | 1): void {
    const current = this.state();
    const templates = current.templates.map((template) => {
      if (template.id !== templateId) {
        return template;
      }
      const index = template.widgetKinds.indexOf(kind);
      if (index === -1) {
        return template;
      }
      const target = index + direction;
      if (target < 0 || target >= template.widgetKinds.length) {
        return template;
      }
      const nextKinds = [...template.widgetKinds];
      const [moved] = nextKinds.splice(index, 1);
      nextKinds.splice(target, 0, moved);
      return { ...template, widgetKinds: nextKinds };
    });
    this.updateState({ ...current, templates });
  }

  reorderWidgets(templateId: string, fromIndex: number, toIndex: number): void {
    const current = this.state();
    const templates = current.templates.map((template) => {
      if (template.id !== templateId) {
        return template;
      }
      const nextKinds = [...template.widgetKinds];
      if (fromIndex < 0 || fromIndex >= nextKinds.length || toIndex < 0 || toIndex >= nextKinds.length) {
        return template;
      }
      const [moved] = nextKinds.splice(fromIndex, 1);
      nextKinds.splice(toIndex, 0, moved);
      return { ...template, widgetKinds: nextKinds };
    });
    this.updateState({ ...current, templates });
  }

  resetTemplate(templateId: string): void {
    const builtIn = DASHBOARD_DEFAULT_TEMPLATES.find((template) => template.id === templateId);
    if (!builtIn) {
      return;
    }
    const current = this.state();
    const templates = current.templates.map((template) =>
      template.id === templateId ? cloneTemplate(builtIn) : template,
    );
    this.updateState({ ...current, templates });
  }

  duplicateTemplate(templateId: string): void {
    const current = this.state();
    const source = current.templates.find((template) => template.id === templateId);
    if (!source) {
      return;
    }
    let counter = 1;
    let nextId = `${source.id}-copy`;
    while (current.templates.some((template) => template.id === nextId)) {
      counter += 1;
      nextId = `${source.id}-copy-${counter}`;
    }
    const duplicated: DashboardTemplate = {
      id: nextId,
      name: `${source.name} (copy)`,
      description: source.description,
      widgetKinds: [...source.widgetKinds],
    };
    const templates = [...current.templates, duplicated];
    this.updateState({ activeTemplateId: nextId, templates });
  }

  private updateState(next: DashboardState): void {
    this.state.set(next);
    try {
      localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage may be unavailable; state still applies for the session
    }
  }
}
