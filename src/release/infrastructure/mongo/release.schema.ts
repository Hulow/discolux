import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ReleaseDocument = HydratedDocument<Release>;

@Schema({ collection: 'releases', versionKey: false })
export class Release {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: Number, required: true, index: true })
  releaseId: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  mongoId?: mongoose.Types.ObjectId;

  @Prop({ type: String })
  status?: string;

  @Prop({ type: Number })
  year?: number;

  @Prop({ type: String })
  url?: string;

  @Prop({ type: Number })
  communityHave?: number;

  @Prop({ type: Number })
  communityWant?: number;

  @Prop({ type: Number })
  ratingCount?: number;

  @Prop({ type: Number })
  ratingAverage?: number;

  @Prop({ type: String })
  addedAt?: string;

  @Prop({ type: String })
  changedAt?: string;

  @Prop({ type: Number })
  numberForSale?: number;

  @Prop({ type: Number })
  lowestPrice?: number;

  @Prop({ type: String })
  country?: string;

  @Prop({ type: Date })
  released?: Date;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: String })
  releaseFormatted?: string;

  @Prop({ type: [String] })
  genres?: string[];

  @Prop({ type: [String] })
  styles?: string[];

  @Prop({ type: Boolean })
  blockedFromSale?: boolean;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  updatedAt: Date;
}

export const ReleaseSchema = SchemaFactory.createForClass(Release);
