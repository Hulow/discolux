export class ProcessReleasesInBatchCommand {
  constructor(
    public readonly from: string,
    public readonly till: string,
  ) {}
}
