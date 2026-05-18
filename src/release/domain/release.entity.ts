export type ReleaseEntityProps = {
  id: string;
  releaseId: number;
  status?: string;
  year?: number;
  url?: string;
  communityHave?: number;
  communityWant?: number;
  ratingCount?: number;
  ratingAverage?: number;
  addedAt?: string;
  changedAt?: string;
  numberForSale?: number;
  lowestPrice?: number;
  country?: string;
  released?: string;
  notes?: string;
  releaseFormatted?: string;
  genres?: string[];
  styles?: string[];
  blockedFromSale?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class ReleaseEntity {
  public readonly id: string;
  public readonly releaseId: number;
  public readonly status?: string;
  public readonly year?: number;
  public readonly url?: string;
  public readonly communityHave?: number;
  public readonly communityWant?: number;
  public readonly ratingCount?: number;
  public readonly ratingAverage?: number;
  public readonly addedAt?: string;
  public readonly changedAt?: string;
  public readonly numberForSale?: number;
  public readonly lowestPrice?: number;
  public readonly country?: string;
  public readonly released?: string;
  public readonly notes?: string;
  public readonly releaseFormatted?: string;
  public readonly genres?: string[];
  public readonly styles?: string[];
  public readonly blockedFromSale?: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: ReleaseEntityProps) {
    this.id = props.id;
    this.releaseId = props.releaseId;
    this.status = props.status;
    this.year = props.year;
    this.url = props.url;
    this.communityHave = props.communityHave;
    this.communityWant = props.communityWant;
    this.ratingCount = props.ratingCount;
    this.ratingAverage = props.ratingAverage;
    this.addedAt = props.addedAt;
    this.changedAt = props.changedAt;
    this.numberForSale = props.numberForSale;
    this.lowestPrice = props.lowestPrice;
    this.country = props.country;
    this.released = props.released;
    this.notes = props.notes;
    this.releaseFormatted = props.releaseFormatted;
    this.genres = props.genres;
    this.styles = props.styles;
    this.blockedFromSale = props.blockedFromSale;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static from(props: ReleaseEntityProps): ReleaseEntity {
    return new ReleaseEntity(props);
  }
}
