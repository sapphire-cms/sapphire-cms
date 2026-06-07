export type BranchInfo = {
  store: string;
  path: string[];
  branchId: string;
};

export function isBranchInfo(obj: unknown): obj is BranchInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'branchId' in obj &&
    typeof obj['branchId'] === 'string'
  );
}
