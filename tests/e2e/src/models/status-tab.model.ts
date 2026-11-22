export interface StatusTabModel {
  name: string;
  count: number;
}

export interface StatusTabsModel {
  all: StatusTabModel;
  planned: StatusTabModel;
  inProgress: StatusTabModel;
  completed: StatusTabModel;
  archived: StatusTabModel;
}
