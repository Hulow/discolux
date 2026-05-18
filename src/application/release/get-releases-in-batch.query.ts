export class GetReleasesInBatchQuery {
  constructor(
    public readonly from: string,
    public readonly till: string,
  ) {}
}
