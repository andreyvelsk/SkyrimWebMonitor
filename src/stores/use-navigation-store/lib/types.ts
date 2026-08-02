export interface SubTab {
  id: string;
  label: string;
}

export interface Tab {
  id: string;
  label: string;
  subTabs: SubTab[];
}