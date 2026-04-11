export interface Subscription {
  id: string;
  fieldMapping: Record<string, string>;
  frequency: number;
}
