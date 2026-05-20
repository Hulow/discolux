import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Interval } from '@nestjs/schedule';
import { ProcessReleasesCommand } from '../../application/process-releases.command';

@Injectable()
export class ProcessReleasesScheduler {
  private running = false;

  constructor(private readonly commandBus: CommandBus) {}

  start(): void {
    this.running = true;
  }

  @Interval(60_000)
  async tick(): Promise<void> {
    if (!this.running) {
      return;
    }

    await this.commandBus.execute(new ProcessReleasesCommand());
  }
}
