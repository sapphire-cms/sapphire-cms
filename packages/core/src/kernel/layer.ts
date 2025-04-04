export interface Layer<Config> {
  // TODO: beter to create a lifecycle interface like Angular
  afterInit?: () => Promise<void>;
}
