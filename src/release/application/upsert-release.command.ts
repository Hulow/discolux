export class UpsertReleaseCommand {
  constructor(
    public readonly id: number,
    public readonly country?: string,
    public readonly released?: string,
    public readonly genres?: string[],
    public readonly styles?: string[],
  ) {}
}
