import raw from './data/activities.json';
import type { Activity } from './types';

export const activities = raw as unknown as Activity[];

export function activityById(id: string | undefined): Activity | undefined {
  return id ? activities.find((a) => a.id === id) : undefined;
}

export function smallerOf(a: Activity): Activity | undefined {
  return activityById(a.smallerId ?? undefined);
}
